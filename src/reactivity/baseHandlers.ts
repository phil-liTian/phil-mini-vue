import { extend, isObject } from '../shared'
import { track, trigger } from './effect'
import { reactive, ReactiveFlag, readonly } from './reactive'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

// 创建getter
function createGetter (isReadonly = false, shallow = false) {
  return function get (target, key) {
    // 不是readonly就是reacitve
    if (key === ReactiveFlag.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlag.IS_READONLY) {
      // 判断是否是只读的
      return isReadonly
    }

    const res = Reflect.get(target, key)

    if (shallow) {
      return res
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    // 依赖收集
    if (!isReadonly) {
      track(target, key)
    }
    return res
  }
}

// 创建setter
function createSetter () {
  return function set (target, key, value) {
    const res = Reflect.set(target, key, value)

    // 触发依赖
    trigger(target, key)
    return res
  }
}

export const mutableHandlers = {
  get,
  set
}

export const readonlyHandler = {
  get: readonlyGet,
  set () {
    console.warn('not allowed set when data is readonly')
    return true
  }
}

export const shallowReadonlyHandler = extend({}, readonlyHandler, {
  get: shallowReadonlyGet
})
