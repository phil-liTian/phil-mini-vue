import {
  mutableHandlers,
  readonlyHandler,
  shallowReadonlyHandler
} from './baseHandlers'

export const enum ReactiveFlag {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly'
}

export function reactive (raw) {
  return createReactiveObject(raw, mutableHandlers)
}

export function readonly (raw) {
  return createReactiveObject(raw, readonlyHandler)
}

export function shallowReadonly (raw) {
  return createReactiveObject(raw, shallowReadonlyHandler)
}

// 判断是否是reactive
export function isReactive (value) {
  return !!value[ReactiveFlag.IS_REACTIVE]
}

// 判断是否是只读的
export function isReadonly (value) {
  return !!value[ReactiveFlag.IS_READONLY]
}

export function isProxy (value) {
  return isReactive(value) || isReadonly(value)
}

// 创建响应式对象
function createReactiveObject (raw, baseHandlers) {
  return new Proxy(raw, baseHandlers)
}
