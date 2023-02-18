import { hasChanged, isObject } from '../shared'
import { isTracking, trackEffects, triggerEffects } from './effect'
import { reactive } from './reactive'

class RefImpl {
  private _value: any
  public dep: any
  private _rawValue: any
  public __v_isRef = true

  constructor (value) {
    this._rawValue = value
    this._value = convert(value)

    this.dep = new Set()
  }

  get value () {
    trackRefEffects(this)
    return this._value
  }

  set value (newValue) {
    // 这里比较的时候需要是一个原生的对象, 所以需要暂存一个未转化前的value对象
    if (hasChanged(this._rawValue, newValue)) {
      this._rawValue = newValue
      this._value = convert(newValue)
      triggerRefEffects(this)
    }
  }
}

export function trackRefEffects (ref) {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}

export function triggerRefEffects (ref) {
  triggerEffects(ref.dep)
}

// 转化, 当ref中是一个对象的时候，将这个对象转化成响应式对象
export function convert (value) {
  return isObject(value) ? reactive(value) : value
}

export function ref (value) {
  return new RefImpl(value)
}

export function isRef (value) {
  return !!value.__v_isRef
}

export function unRef (ref) {
  return isRef(ref) ? ref.value : ref
}

// 应用场景: 当我们在模板中使用ref定义的变量的时候是不需要.value的
export function proxyRefs (objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get (target, key) {
      return unRef(Reflect.get(target, key))
    },

    set (target, key, value) {
      // Reflect.set(target, key, value)
      // return Reflect.set(target, key, value)

      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value)
      } else {
        return Reflect.set(target, key, value)
      }
    }
  })
}
