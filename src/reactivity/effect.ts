
class EffectReactive {
  private _fn: any

  constructor(fn) {
    this._fn = fn
  }

  run() {
    activeEffect = this
    this._fn()
  }
  
}

// 依赖收集
let targetMap = new Map()
export function track(target, key) {
  let depsMap = targetMap.get(target)
  if( !depsMap ) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let deps = depsMap.get(key)
  if( !deps ) {
    deps = new Set()
    depsMap.set(key, deps)
  }

  deps.add(activeEffect)
}

// 触发依赖
export function trigger(target, key) {
  let depsMap = targetMap.get(target)
  let deps = depsMap.get(key)
  for (const effect of deps) {
    effect.run()
  }
}

let activeEffect;
export function effect(fn) {
  const _effect = new EffectReactive(fn)

  _effect.run()
}