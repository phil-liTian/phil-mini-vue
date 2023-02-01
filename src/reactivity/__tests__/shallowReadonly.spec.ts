import { isReadonly, shallowReadonly } from "../reactive";

describe('shallowReadonly', () => { 
  it('happy path', () => {
    const original = { user: { name: 'phil' } }
    const wrapped = shallowReadonly(original)
    expect(isReadonly(wrapped.user)).toBe(false)
  });

})