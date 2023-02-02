export const extend = Object.assign

export const isObject = value => {
  return value !== null && typeof value === 'object'
}

export const hasChanged = (value, oldValue) => {
  return !Object.is(value, oldValue)
}