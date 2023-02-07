import { effect } from "../reactivity";
import { EMPTY_OBJ, isObject, isOn, ShapeFlags } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp";

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export function createRender(options) {
  const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options

  function render(vnode, container, parent = null) {
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
  function patch(n1, n2, container, parent, anchor = null) {
    
    const { shapeFlags } = n2
    
    switch (n2.type) {
      case Fragment:
        processFragment(n1, n2, container, parent)
        break;
      
      case Text: 
        processText(n1, n2, container)
        break
    
      default:
        if( shapeFlags & ShapeFlags.ELEMENT ) {
          processElement(n1, n2, container, parent, anchor)
        } else if( shapeFlags & ShapeFlags.STATEFUL_COMPONENT ) {
          // 处理组件
          processComponent(n2, container, parent)
        }
        break;
    }
  }

  function processText(n1, vnode, container) {
    
    const textContent = (vnode.el = document.createTextNode(vnode.children))
    console.log('textContent', textContent);
    container.append(textContent)
  }

  function processFragment(n1, vnode, container, parent) {
    mountChildren(n1, vnode.children, container, parent)
  }

  function processElement(n1, vnode: any, container: any, parent, anchor) {
    if( n1 ) {
      // 走更新逻辑
      updateElement(n1, vnode, container, parent)
    } else {
      mountElement(n1, vnode, container, parent, anchor)
    }
  }

  // 初始化element
  function mountElement(n1, vnode, container, parent, anchor) {
    
    const { type, children, props, shapeFlags } = vnode
    // console.log('type', hostCreateElement(type));
    
    const el = (vnode.el = hostCreateElement(type))

    if( shapeFlags & ShapeFlags.TEXT_CHILDREN ) {
      el.textContent = children
    } else if( shapeFlags & ShapeFlags.ARRAY_CHILDREN ) {
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
  function updateElement(n1, n2, container, parentComponent) {
    console.log('n1, n2==>', n1, n2);
    
    // 处理props
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    const el = (n2.el = n1.el)
    patchProps(oldProps, newProps, el)

    // 处理children
    patchChildren(n1, n2, el, parentComponent)
  }

  function patchChildren(n1, n2, container, parentComponent) {
    console.log('n1, n2', n1, n2);
    const { shapeFlags: prevShapeFlags, children: c1 } = n1
    const { shapeFlags, children: c2 } = n2

    // 新children是text类型
    if( shapeFlags & ShapeFlags.TEXT_CHILDREN ) {
      // 之前的children是array类型的
      if( prevShapeFlags & ShapeFlags.ARRAY_CHILDREN ) {
        // 删除原来的数组类型的children
        unmountChildren(c1)
        // 设置children内容是text
        // hostSetElementText(c2, container)
      } 
      // 都是text
      if( c1 !== c2) {
        hostSetElementText(c2, container)
      }  
    } else {
      
      if( prevShapeFlags & ShapeFlags.TEXT_CHILDREN ) {
        // 新的是一个数组，老的是一个文本节点
        hostSetElementText('', container)
        
        mountChildren(n1, n2.children, container, parentComponent)
        
      } else {
        // 处理原来的children和新children都是array的情况
        patchedKeyedChildren(n1, n2, container, parentComponent)
      }
    }
  }
  

  function patchedKeyedChildren(n1, n2, container, parentComponent) {
    
    const c1 = n1.children
    const c2 = n2.children
    
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    const l2 = c2.length

    function isSameNodeType(n1, n2) {
      return n1.key === n2.key && n1.type === n2.type
    }

    // 左 => 右
    while(i <= Math.min(e1, e2)) {
      const prevChild = c1[i]
      const nextChild = c2[i]

      // 节点相同
      if(!isSameNodeType(prevChild, nextChild)) {
        break
      }
      patch(prevChild, nextChild, container, parentComponent)
      i++
    }

    // 右 => 左
    while(i <= Math.min(e1, e2)) {
      const prevChild = c1[e1]
      const nextChild = c2[e2]

      // 节点相同
      if(!isSameNodeType(prevChild, nextChild)) {
        break
      }
      patch(prevChild, nextChild, container, parentComponent)
      e1--
      e2--
    }

    if( i > e1 && i<= e2 ) {
      // 新的比旧的长 需要创建新节点
      const nextIdx = e2 + 1 
      console.log('c2[nextIdx]', c2[nextIdx]);
      const anchor = nextIdx < l2 ? c2[nextIdx].el : null
      // 创建新节点
      while(i <= e2) {
        console.log(`新的比旧的长，需要创建新vnode:${c2[i].key}`);
        patch(null, c2[i], container, parentComponent, anchor)
        i++
      }
    } else if( i > e2 && i <= e1 ) {
      // 新的比旧的短 需要删除节点
      while( i <= e1 ) {
        console.log(`新的比旧的短，需要删除vnode:${c1[i].key}`);
        hostRemove(c1[i].el)
        i++
      }
    }
    
    // console.log('i', i);
    // console.log('e1, e2', e1, e2);
    
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      // remove
      hostRemove(el)
      
    }
  }

  function patchProps(oldProps, newProps, el) {
    // console.log('oldProps, newProps', oldProps, newProps);
    // 第一种情况，改变props的值
    for (const key in newProps) {
      const nextProp = newProps[key]
      const prevProp = oldProps[key]
      
      if( nextProp !== prevProp ) {
        hostPatchProp(el, key, prevProp, nextProp)
      }
    }

    // 第三种情况 删除了prop
    if ( oldProps !== EMPTY_OBJ ) {
      for (const key in oldProps) {
        if(!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
    
  }

  function mountChildren(n1, children, container, parent) {
    children.forEach(item => {
      patch(null, item, container, parent)
    })
  }

  function processComponent(vnode, container, parent) {
    mountComponent(vnode, container, parent)
  }

  function mountComponent(vnode, container, parent) {
    const instance = createComponentInstance(vnode, parent)
    setupComponent(instance)

    setupRenderEffect(instance, vnode, container)
  }

  function setupRenderEffect(instance: any, vnode, container) {
    const { proxy } = instance
    effect(() => {
      // console.log('instance', instance);
      if( !instance.isMounted ) {
        // init
        const subTree = instance.render.call(proxy)

        instance.subTree = subTree
        // vnode
        patch(null, subTree, container, instance)
        vnode.el = subTree.el
        instance.isMounted = true
      } else {
        // update
        const subTree = instance.render.call(proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree
        patch(prevSubTree, subTree, container, instance)
      }
    })
  }

  return {
    createApp: createAppAPI(render)
  }
}

