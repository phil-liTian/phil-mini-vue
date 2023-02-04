import { h } from '../../lib/mini-vue.esm.js'
import { Foo } from './Foo.js'
import { EmitFoo } from './emitFoo.js'

window.$self = null

export const App = {
  name: 'App',
  render() {
    window.$self = this
    // return h('div', {id: 'root'}, 
    //   [h("p", {class: "red"}, 'hello'), h("p", { class: 'blue' }, 'mini-vue')]
    // )

    return h('div', { 
      // onClick: () => { console.log('onClick') },
      // onMousedown: () => { console.log('onmousedown') }
    }, 
      [
        h('div', {}, `hello ${this.msg}`),
        h(Foo, { count: 1 }),
        h(EmitFoo, { onAddFoo: (a, b) => { console.log(a, b) } })
      ]
    )
  },

  setup() {
    return {
      msg: 'phil mini-vue'
    }
  }
}