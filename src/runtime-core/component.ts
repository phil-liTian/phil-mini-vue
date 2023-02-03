import { shallowReadonly } from "../reactivity/reactive"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"


export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {}
  }

  return component
} 

export function setupComponent(instance) {
  // TODO
  initProps(instance, instance.vnode.props)
  // initSlots()
  setupStatefulComponent(instance)
}

// 初始化有状态的组件
function setupStatefulComponent(instance) {
  const Component = instance.type

  const { setup } = Component
  
  if( setup ) {
    const setupResult = setup(shallowReadonly(instance.props))
    handleSetupResult(instance, setupResult)
  }

  instance.proxy = new Proxy({_: instance} , PublicInstanceProxyHandlers)
}

function handleSetupResult(instance, setupResult) {
  // TODO: 实现一个函数
  if( typeof setupResult === 'object' ) {
    instance.setupState = setupResult
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type

  if( Component.render ) {
    instance.render = Component.render
  }
}

