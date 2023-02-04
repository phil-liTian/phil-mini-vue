import { createTextVNode, h, getCurrentInstance } from "../../lib/mini-vue.esm.js"
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  setup() {
    console.log('this', getCurrentInstance());
    return {

    }
  },

  render() {
    return h('div', {}, [h(Foo), createTextVNode('这是一个textVNode')])
  }
}