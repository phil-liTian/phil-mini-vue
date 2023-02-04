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

// 将肉串样式转化成驼峰
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : ''
  })
}

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const isArray = Array.isArray
