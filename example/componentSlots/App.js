import { h } from "../../lib/mini-vue.esm.js"
import { Foo } from "./Foo.js"

export const App = {
  name: 'App',
  setup() {

  },

  render() {
    const title = h('h4', {}, '用来研究slots源码实现')
    const p = h('p', {}, '123')
    const foo = h('div', {}, [h(Foo, {}, {
      header: ({ age }) =>  h('p', {}, 'header' + age),
      footer: () =>  h('p', {}, 'footer')
    })])
    return h('div', {}, [title, foo])
  }
}