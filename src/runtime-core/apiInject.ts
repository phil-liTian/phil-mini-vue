import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // 存 
  let currentInstance: any = getCurrentInstance()
  if( currentInstance ) {
    let { provides, parent } = currentInstance
    const parentProvides = parent.provides
    
    if( provides === parentProvides ) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }

    provides[key] = value
  }
}

export function inject(key, defaultValue) {
  // 取
  const currentInstance: any = getCurrentInstance()
  const { parent } = currentInstance
  const parentProvides = parent.provides
  
  if( defaultValue ) {
    if( typeof defaultValue === 'function' ) {
      return defaultValue()
    }
    return defaultValue
  }

  return parentProvides[key] || ''
}