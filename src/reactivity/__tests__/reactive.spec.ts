import { isProxy, isReactive, reactive } from "../reactive"

describe('reactive', () => { 
  it('happy path', () => {
    const original = { foo: 1 }
    const observed = reactive(original)

    expect(observed).not.toBe(original)
    expect(isReactive(observed)).toBe(true)
    expect(isProxy(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
    expect(observed.foo).toBe(1)
  })

  
  it('nested reactive', () => {
    const original = { foo: 1, bar: { name: 'phil' } }
    const observed = reactive(original)

    expect(isReactive(observed.bar)).toBe(true)
  });
})