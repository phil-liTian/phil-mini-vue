import { ShapeFlags } from '../shared/shapeFlags'
import { Text } from './renderer'

// 创建一个虚拟节点，后续尽量都基于这个vnode进行操作
export function createVNode (type, props?, children?) {
  let vnode = {
    type,
    props,
    children,
    key: props?.key,
    component: null,
    shapeFlags: getShapeType(type)
  }

  if (typeof children === 'string') {
    vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN
  }

  // 判断是否slots类型
  // 是组件类型 并且children是一个object
  if (vnode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlags |= ShapeFlags.SLOT_CHILDREN
    }
  }

  return vnode
}

// 创建一个文本节点
export function createTextVNode (text: string) {
  return createVNode(Text, {}, text)
}

// 获取类型
function getShapeType (type) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}
