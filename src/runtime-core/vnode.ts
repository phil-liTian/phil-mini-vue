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

  return vnode
}

function getShapeType(type) {
  return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}