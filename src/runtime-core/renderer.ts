import { isObject, isOn, ShapeFlags } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component"

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export function render(vnode, container, parent = null) {
  // patch
  patch(vnode, container, parent)
}

export function patch(vnode, container, parent) {
  const { shapeFlags } = vnode
  
  switch (vnode.type) {
    case Fragment:
      processFragment(vnode, container, parent)
      break;
    
    case Text: 
      processText(vnode, container)
      break
  
    default:
      if( shapeFlags & ShapeFlags.ELEMENT ) {
        processElement(vnode, container, parent)
      } else if( shapeFlags & ShapeFlags.STATEFUL_COMPONENT ) {
        // 处理组件
        processComponent(vnode, container, parent)
      }
      break;
  }
}

function processText(vnode, container) {
  
  const textContent = (vnode.el = document.createTextNode(vnode.children))
  console.log('textContent', textContent);
  container.append(textContent)
}

function processFragment(vnode, container, parent) {
  mountChildren(vnode, container, parent)
}

function processElement(vnode: any, container: any, parent) {
  mountElement(vnode, container, parent)
}

function mountElement(vnode, container, parent) {
  const { type, children, props, shapeFlags } = vnode
  const el = (vnode.el = document.createElement(type))
  
  if( shapeFlags & ShapeFlags.TEXT_CHILDREN ) {
     el.textContent = children
  } else if( shapeFlags & ShapeFlags.ARRAY_CHILDREN ) {
    mountChildren(vnode, el, parent)
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

function mountChildren(vnode, container, parent) {
  vnode.children.forEach(item => {
    patch(item, container, parent)
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
  const subTree = instance.render.call(proxy)

  // vnode
  patch(subTree, container, instance)

  // console.log('subTree', subTree.el);
  vnode.el = subTree.el
}


