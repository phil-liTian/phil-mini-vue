import { camelize, capitalize } from '../shared/index'

export function emit (instance, event, ...args) {
  const props = instance.props
  // TPP 的开发思想： 先写一个特定的行为，然后再重构成通用的行为
  const handleKey = `on${capitalize(camelize(event))}`
  const handler = props[handleKey]
  handler && handler(...args)
}
