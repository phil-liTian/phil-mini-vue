import { createRender } from '../runtime-core'
import { isOn } from '../shared'

function createElement(type) {
  // console.log('createElement-----');
  
  return document.createElement(type)
}

function patchProp(el, key, oldValue, value) {
  
  // console.log('patchProp-----');

  if( isOn(key) ) {
    const eventName = key.slice(2).toLowerCase()
    el.addEventListener(eventName, value)
  }
  // 第二种情况将value设置成undefined、null
  if( value == undefined || value == null ) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)   
  }
}

function insert(el, container, anchor = null) {
  // console.log('insert-----');
  // container.append(el)
  container.insertBefore(el, anchor)
}

function remove(child) {
  const parent = child.parentNode
  if( parent ) {
    parent.removeChild(child)
  }
}

function setElementText(child, el) {
  el.textContent = child
} 

const renderer: any = createRender({
  createElement, 
  patchProp, 
  insert,
  remove,
  setElementText
})


export const createApp = (...args) => {
  // console.log('args', args);
  
  return renderer.createApp(...args)
}

export * from '../runtime-core'
