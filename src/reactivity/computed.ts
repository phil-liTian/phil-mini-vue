import { ReactiveEffect } from './effect'

class ComputedRefImpl {
  private _getter: any
  _value: any
  private _effect: ReactiveEffect
  private _dirty: boolean

  constructor (getter) {
    this._dirty = true

    this._effect = new ReactiveEffect(getter, () => {
      if (this._dirty) return
      this._dirty = true
    })
  }

  get value () {
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
}

export function computed (getter) {
  return new ComputedRefImpl(getter)
}
