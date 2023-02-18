import { effect } from '../reactivity'
import { EMPTY_OBJ, isObject, isOn, ShapeFlags } from '../shared'
import { createComponentInstance, setupComponent } from './component'
import { shouldUpdateComponent } from './componentRenderUtils'
import { createAppAPI } from './createApp'
import { queueJobs } from './scheduler'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export function createRender (options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options

  function render (vnode, container, parent = null) {
    // console.log('vnode, container, parent = null', vnode, container, parent);

    // patch
    patch(null, vnode, container, parent)
  }
  /**
   *
   * @param n1 初始化的vnode
   * @param n2 新的vnode
   * @param container 容器
   * @param parent 父组件
   */
  function patch (n1, n2, container, parent, anchor = null) {
    const { shapeFlags } = n2

    switch (n2.type) {
      case Fragment:
        processFragment(n1, n2, container, parent)
        break

      case Text:
        processText(n1, n2, container)
        break

      default:
        if (shapeFlags & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parent, anchor)
        } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(n1, n2, container, parent)
        }
        break
    }
  }

  function processText (n1, vnode, container) {
    const textContent = (vnode.el = document.createTextNode(vnode.children))
    container.append(textContent)
  }

  function processFragment (n1, vnode, container, parent) {
    mountChildren(n1, vnode.children, container, parent)
  }

  function processElement (n1, vnode: any, container: any, parent, anchor) {
    if (n1) {
      // 走更新逻辑
      updateElement(n1, vnode, container, parent, anchor)
    } else {
      mountElement(n1, vnode, container, parent, anchor)
    }
  }

  // 初始化element
  function mountElement (n1, vnode, container, parent, anchor) {
    const { type, children, props, shapeFlags } = vnode
    // console.log('type', hostCreateElement(type));

    const el = (vnode.el = hostCreateElement(type))

    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(n1, vnode.children, el, parent)
    }

    for (const key in props) {
      const value = props[key]

      hostPatchProp(el, key, null, value)
      // if( isOn(key) ) {
      //   const eventName = key.slice(2).toLowerCase()
      //   el.addEventListener(eventName, value)
      // }
      // el.setAttribute(key, value)
    }

    // container.append(el)
    hostInsert(el, container, anchor)
  }

  // 更新element
  function updateElement (n1, n2, container, parentComponent, anchor) {
    // 处理props
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    const el = (n2.el = n1.el)
    patchProps(oldProps, newProps, el)

    // 处理children
    patchChildren(n1, n2, el, parentComponent, anchor)
  }

  // 更新children
  function patchChildren (n1, n2, container, parentComponent, anchor) {
    const { shapeFlags: prevShapeFlags, children: c1 } = n1
    const { shapeFlags, children: c2 } = n2

    // 新children是text类型
    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      // 之前的children是array类型的
      if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        // 删除原来的数组类型的children
        unmountChildren(c1)
        // 设置children内容是text
        // hostSetElementText(c2, container)
      }
      // 都是text
      if (c1 !== c2) {
        hostSetElementText(c2, container)
      }
    } else {
      if (prevShapeFlags & ShapeFlags.TEXT_CHILDREN) {
        // 新的是一个数组，老的是一个文本节点
        hostSetElementText('', container)

        mountChildren(n1, n2.children, container, parentComponent)
      } else {
        // 处理原来的children和新children都是array的情况
        patchedKeyedChildren(n1, n2, container, parentComponent, anchor)
      }
    }
  }

  // 这里处理的是最复杂的一种情况，即新老节点都是array，这里用到双端diff算法来实现更新
  function patchedKeyedChildren (
    n1,
    n2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const c1 = n1.children
    const c2 = n2.children

    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    const l2 = c2.length

    // 结合type和key判断是否是相同节点，至于使用到key是为了优化比较性能
    function isSameNodeType (n1, n2) {
      return n1.key === n2.key && n1.type === n2.type
    }

    // 左 => 右
    while (i <= Math.min(e1, e2)) {
      const prevChild = c1[i]
      const nextChild = c2[i]

      // 节点相同
      if (!isSameNodeType(prevChild, nextChild)) {
        break
      }
      patch(prevChild, nextChild, container, parentComponent)
      i++
    }

    // 右 => 左
    while (i <= Math.min(e1, e2)) {
      const prevChild = c1[e1]
      const nextChild = c2[e2]

      // 节点相同
      if (!isSameNodeType(prevChild, nextChild)) {
        break
      }
      patch(prevChild, nextChild, container, parentComponent)
      e1--
      e2--
    }

    if (i > e1 && i <= e2) {
      // 新的比旧的长 需要创建新节点
      const nextIdx = e2 + 1
      const anchor = nextIdx < l2 ? c2[nextIdx].el : null
      // 创建新节点
      while (i <= e2) {
        console.log(`新的比旧的长，需要创建新vnode:${c2[i].key}`)
        patch(null, c2[i], container, parentComponent, anchor)
        i++
      }
    } else if (i > e2 && i <= e1) {
      // 新的比旧的短 需要删除节点
      while (i <= e1) {
        console.log(`新的比旧的短，需要删除vnode:${c1[i].key}`)
        hostRemove(c1[i].el)
        i++
      }
    } else {
      // 处理乱序的情况，原则是尽量减少真实dom操作
      const s1 = i
      const s2 = i
      // 处理优化的地方
      // 待处理的节点总数
      const toBePatched = e2 - s2 + 1
      let patched = 0
      let moved = false
      let maxNewIndexSoFar = 0
      // 创建一个map结构，为新节点的key和index的映射关系,
      const keyToNewIndexMap = new Map()
      // 初始化旧节点到新节点的映射关系
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)
      for (let i = s2; i <= e2; i++) {
        const newChild = c2[i]
        keyToNewIndexMap.set(newChild.key, i)
      }

      for (let i = s1; i <= e1; i++) {
        const oldChild = c1[i]
        // 优化: 如果已经patch过的节点等于待处理的节点总数的话，说明新节点中已经没有还未处理的节点了，则将旧节点中的children直接删除即可
        if (patched >= toBePatched) {
          hostRemove(oldChild.el)
          continue
        }

        // 处理newIndex的匹配逻辑
        let newIndex
        if (oldChild.key) {
          // 如果属性中标明了key的话，则直接使用key进行比较，时间复杂度为o(1)
          newIndex = keyToNewIndexMap.get(oldChild.key)
        } else {
          // 没有指定key，遍历进行比较，时间复杂度为o(n)
          for (let j = 0; j <= e2; j++) {
            const newChild = c2[j]
            if (isSameNodeType(oldChild, newChild)) {
              newIndex = j
              break
            }
          }
        }

        if (!newIndex) {
          // 旧节点中的children在新节点中已经不存在了,则删除旧节点
          hostRemove(oldChild.el)
        } else {
          if (newIndex > maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }

          newIndexToOldIndexMap[newIndex - s2] = i + 1
          // 有的话需要创建
          patch(oldChild, c2[newIndex], container, parentComponent, null)
          patched++
        }
      }

      const increasingNewIndexMap = moved
        ? getSequence(newIndexToOldIndexMap)
        : []
      let j = increasingNewIndexMap.length - 1

      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 >= l2 ? parentAnchor : c2[nextIndex + 1].el
        if (newIndexToOldIndexMap[i] === 0) {
          // 说明在旧节点中不存在，需要创建新节点
          patch(null, nextChild, container, parentComponent, anchor)
        } else if (moved) {
          if (j < 0 || increasingNewIndexMap[j] !== i) {
            console.log('需要移动位置')
            hostInsert(nextChild.el, container, anchor)
          } else {
            // 命中的节点，不需要移动children
            j--
          }
        }
      }
    }
  }

  function unmountChildren (children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      // remove
      hostRemove(el)
    }
  }

  function patchProps (oldProps, newProps, el) {
    // console.log('oldProps, newProps', oldProps, newProps);
    // 第一种情况，改变props的值
    for (const key in newProps) {
      const nextProp = newProps[key]
      const prevProp = oldProps[key]

      if (nextProp !== prevProp) {
        hostPatchProp(el, key, prevProp, nextProp)
      }
    }

    // 第三种情况 删除了prop
    if (oldProps !== EMPTY_OBJ) {
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
  }

  function mountChildren (n1, children, container, parent) {
    children.forEach(item => {
      patch(null, item, container, parent)
    })
  }

  function processComponent (n1, vnode, container, parent) {
    if (!n1) {
      mountComponent(vnode, container, parent)
    } else {
      updateComponent(n1, vnode)
    }
  }

  // 更新组件
  function updateComponent (n1, n2) {
    const instance = (n2.component = n1.component)
    if (shouldUpdateComponent(n1, n2)) {
      // 更新成n2
      instance.next = n2
      instance.update()
    } else {
      console.log(`组件不需要更新: ${instance}`)
      n2.component = n1.component
      n2.el = n1.el
      instance.vnode = n2
    }
  }

  function mountComponent (vnode, container, parent) {
    const instance = (vnode.component = createComponentInstance(vnode, parent))

    setupComponent(instance)
    setupRenderEffect(instance, vnode, container)
  }

  function setupRenderEffect (instance: any, vnode, container) {
    const { proxy } = instance
    instance.update = effect(
      () => {
        // console.log('instance', instance);
        if (!instance.isMounted) {
          // init
          // 这里就保证了render函数中的this指向的是proxy实例，这个proxy是在setupStatefulComponent中挂载的
          const subTree = instance.render.call(proxy)

          instance.subTree = subTree
          // vnode
          patch(null, subTree, container, instance)
          vnode.el = subTree.el
          instance.isMounted = true
        } else {
          // update
          const { next, vnode } = instance
          if (next) {
            // 更新组件的内容
            // next 和 vnode的区别是： 我们此时需要实现的是将vnode => next
            next.el = vnode.el
            updateComponentPreRender(instance, next)
          }
          const subTree = instance.render.call(proxy)
          const prevSubTree = instance.subTree
          instance.subTree = subTree
          patch(prevSubTree, subTree, container, instance)
        }
      },
      {
        scheduler: () => {
          // console.log('scheduler');
          queueJobs(instance.update)
        }
      }
    )
  }

  // 更新组件
  function updateComponentPreRender (instance, nextVNode) {
    nextVNode.component = instance
    instance.vnode = nextVNode
    instance.next = null
    // 将nextVNode的props赋值到实例的props上
    instance.props = nextVNode.props
  }

  return {
    createApp: createAppAPI(render)
  }
}

// 获取最长递增子序列
function getSequence (arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
