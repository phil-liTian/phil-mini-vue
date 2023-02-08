import { hasOwn } from "../shared/index"

const publicPropertiesMap = {
  '$el': (i) => i.vnode.el,
  '$slots': i => i.slots,
  '$props': i => i.props
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState } = instance
    
    if(hasOwn(setupState, key) ) {
      return setupState[key]
    }

    if(hasOwn(instance.props, key)) {
      return instance.props[key]
    }
    // if( key in setupState) {
    //   return setupState[key]
    // }

    // if(key in instance.props) {
    //   return instance.props[key]
    // }

    const publicGetter = publicPropertiesMap[key]

    if( publicGetter ) {
      return publicGetter(instance)
    }
  }
}