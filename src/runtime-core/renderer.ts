import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
  // patch

  patch(vnode, container)
}


export function patch(vnode, container) {
  // 处理组件
  // TODO
  console.log('vnode', vnode.type);
  if( typeof vnode.type === 'string' ) {
    processElement(vnode, container)
  } else if( isObject(vnode.type) ) {
    processComponent(vnode, container)
  }
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}

function mountElement(vnode, container) {
  const { type, children, props } = vnode
  const el = document.createElement(type)

  if( typeof children === 'string' ) {
     el.textContent = children
  } else if( Array.isArray(children) ) {
    // mountChildren(vnode, children)
    children.forEach(item => {
      patch(item, el)
    })
  }

  for (const key in props) {
    const value = props[key]
    el.setAttribute(key, value)    
  }

  container.append(el)
}

function mountChildren(vnode, children) {
  
}

function processComponent(vnode, container) {
  mountComponent(vnode, container)
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode)
  setupComponent(instance)

  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance: any, container) {
  const subTree = instance.render()

  // vnode
  patch(subTree, container)
}


