import { shallowReadonly } from "../reactivity/reactive"
import { proxyRefs } from "../reactivity/ref"
import { emit } from "./componentEmits"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

let currentInstance = null
export function createComponentInstance(vnode, parent) {
  let component = {
    vnode,
    next: null,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    isMounted: false,
    subTree: {},
    emit: () => {}
  }
  component.emit = emit.bind(null, component) as any

  return component
} 

export function setupComponent(instance) {
  // TODO
  initProps(instance, instance.vnode.props)
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance)
}

// 初始化有状态的组件
function setupStatefulComponent(instance) {
  const Component = instance.type

  const { setup } = Component
  
  if( setup ) {
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit })
    handleSetupResult(instance, proxyRefs(setupResult))
    setCurrentInstance(null)
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

export function getCurrentInstance() {
  return currentInstance
}

export function setCurrentInstance(instance) {
  currentInstance = instance
}

