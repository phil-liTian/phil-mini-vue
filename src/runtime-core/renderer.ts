import { isObject, isOn, ShapeFlags } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
  // patch
  patch(vnode, container)
}


export function patch(vnode, container) {
  // 处理组件
  // TODO
  const { shapeFlags } = vnode
  if( shapeFlags & ShapeFlags.ELEMENT ) {
    processElement(vnode, container)
  } else if( shapeFlags & ShapeFlags.STATEFUL_COMPONENT ) {
    processComponent(vnode, container)
  }
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}

function mountElement(vnode, container) {
  const { type, children, props, shapeFlags } = vnode
  const el = (vnode.el = document.createElement(type))
  
  if( shapeFlags & ShapeFlags.TEXT_CHILDREN ) {
     el.textContent = children
  } else if( shapeFlags & ShapeFlags.ARRAY_CHILDREN ) {
    mountChildren(el, children)
  }


  for (const key in props) {
    const value = props[key]
    
    if( isOn(key) ) {
      const eventName = key.slice(2).toLowerCase()
      el.addEventListener(eventName, value)
    }
    el.setAttribute(key, value)    
  }

  container.append(el)
}

function mountChildren(el, children) {
  children.forEach(item => {
    patch(item, el)
  })
}

function processComponent(vnode, container) {
  mountComponent(vnode, container)
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode)
  setupComponent(instance)

  setupRenderEffect(instance, vnode, container)
}

function setupRenderEffect(instance: any, vnode, container) {
  const { proxy } = instance
  const subTree = instance.render.call(proxy)

  // vnode
  patch(subTree, container)

  // console.log('subTree', subTree.el);
  vnode.el = subTree.el
}


