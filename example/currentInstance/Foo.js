import { h, getCurrentInstance } from "../../lib/mini-vue.esm.js"

export const Foo = {
  name: 'Foo',
  setup() {
    console.log('this', getCurrentInstance());
    return {}
  },

  render() {
    return h('div', {}, 'foo') 
  }
}