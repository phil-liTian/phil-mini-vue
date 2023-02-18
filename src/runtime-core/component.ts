import { shallowReadonly } from '../reactivity/reactive'
import { proxyRefs } from '../reactivity/ref'
import { emit } from './componentEmits'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentSlots'

let currentInstance = null
export function createComponentInstance (vnode, parent) {
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

export function setupComponent (instance) {
  // 初始化props
  initProps(instance, instance.vnode.props)
  // 初始化slots
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance)
}

// 初始化有状态的组件
function setupStatefulComponent (instance) {
  const Component = instance.type
  const { setup } = Component

  if (setup) {
    setCurrentInstance(instance)
    // 将实例的props对象和emit方法传到setup函数中
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })
    handleSetupResult(instance, proxyRefs(setupResult))
    setCurrentInstance(null)
  }

  // 这里实现组件代理对象
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
}

// 将setup执行后返回的结果挂载到组件实例的setupState属性上
function handleSetupResult (instance, setupResult) {
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }

  finishComponentSetup(instance)
}

function finishComponentSetup (instance: any) {
  const Component = instance.type

  if (Component.render) {
    instance.render = Component.render
  }
}

// 获取组件实例，该方法必须在setup函数中使用
export function getCurrentInstance () {
  return currentInstance
}

// 设置当前组件实例
export function setCurrentInstance (instance) {
  currentInstance = instance
}
