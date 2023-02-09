import { isArray, ShapeFlags } from "../shared/index"

// 初始化插槽
export function initSlots(instance, children) {
  const { vnode  } = instance
  // 这里需要判断一下当前组件是不是插槽
  if(vnode.shapeFlags & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(instance.slots, children)
  }
}

function normalizeObjectSlots(slots, children) {
  for (const key in children) {
    const value = children[key]
    // 这里是为了实现作用于插槽, 故value是一个函数
    if( value ) {
      slots[key] = (props) =>  normalizeSlotValue(value(props))
    }
  }
}

// 兼容插槽是单个vnode或者是一个vnode数组的情况
function normalizeSlotValue(value) {
  return isArray(value) ? value : [value]
}