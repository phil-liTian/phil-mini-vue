export * from './shapeFlags'

export const extend = Object.assign

export const isObject = value => {
  return value !== null && typeof value === 'object'
}

export const hasChanged = (value, oldValue) => {
  return !Object.is(value, oldValue)
}

// 判断是否是以on开头
export const isOn = (key: string) => {
  return /^on[A-Z]/.test(key)
}

export const hasOwn = (obj, key) =>  Object.prototype.hasOwnProperty.call(obj, key)
