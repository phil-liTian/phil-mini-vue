import { effect } from "../reactivity";
import { EMPTY_OBJ, isObject, isOn, ShapeFlags } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp";

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export function createRender(options) {
  const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options

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
  function patch(n1, n2, container, parent) {
    
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
          processElement(n1, n2, container, parent)
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
    mountChildren(n1, vnode, container, parent)
  }

  function processElement(n1, vnode: any, container: any, parent) {
    if( n1 ) {
      // 走更新逻辑
      updateElement(n1, vnode, container)
    } else {
      mountElement(n1, vnode, container, parent)
    }
  }

  // 初始化element
  function mountElement(n1, vnode, container, parent) {
    
    const { type, children, props, shapeFlags } = vnode
    const el = (vnode.el = hostCreateElement(type))
    
    if( shapeFlags & ShapeFlags.TEXT_CHILDREN ) {
      el.textContent = children
    } else if( shapeFlags & ShapeFlags.ARRAY_CHILDREN ) {
      mountChildren(n1, vnode, el, parent)
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
    hostInsert(el, container)
  }

  // 更新element
  function updateElement(n1, n2, container) {
    console.log('update');
    console.log('n1', n1);
    console.log('n2', n2);

    // 处理props
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    const el = (n2.el = n1.el)
    patchProps(oldProps, newProps, el)

    // 处理children
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

  function mountChildren(n1, vnode, container, parent) {
    vnode.children.forEach(item => {
      patch(n1, item, container, parent)
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

