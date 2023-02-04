import { ShapeFlags } from "../shared/shapeFlags"

export function createVNode(type, props?, children?) {
  let vnode = {
    type,
    props,
    children,
    shapeFlags: getShapeType(type)
  }

  if( typeof children === 'string' ) {
    vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN
  } else if( Array.isArray(children) ) {
    vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN
  }

  // 判断是否slots类型
  // 是组件类型 并且children是一个object
  if( vnode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT ) {
    if( typeof children === 'object' ) {
      vnode.shapeFlags |= ShapeFlags.SLOT_CHILDREN
    }
  }

  return vnode
}

function getShapeType(type) {
  return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}