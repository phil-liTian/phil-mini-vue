import { createRender } from '../runtime-core'
import { isOn } from '../shared'

function createElement(type) {
  // console.log('createElement-----');
  
  return document.createElement(type)
}

function patchProp(el, key, value) {
  // console.log('patchProp-----');

  if( isOn(key) ) {
    const eventName = key.slice(2).toLowerCase()
    el.addEventListener(eventName, value)
  }
  el.setAttribute(key, value)   
}

function insert(el, container) {
  // console.log('insert-----');
  container.append(el)
}

const renderer: any = createRender({
  createElement, 
  patchProp, 
  insert
})


export const createApp = (...args) => {
  // console.log('args', args);
  
  return renderer.createApp(...args)
}

export * from '../runtime-core'
