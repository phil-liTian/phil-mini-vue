import { h, renderSlots } from "../../lib/mini-vue.esm.js"

export const Foo = {
  setup() {

  },

  render() {
    console.log(this.$slots);
    const foo = h('p', {}, 'foo')
    const age = 26
    return h('div', {}, [
      renderSlots(this.$slots, 'header', { age }), 
      foo, 
      renderSlots(this.$slots, 'footer')
    ])
  }
}