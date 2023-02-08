
import { h, ref } from '../../lib/mini-vue.esm.js'
import { Child } from './Child.js'

export const App = {
  setup() {
    const msg = ref(1)
    const count = ref(2)

    const changeMsg = () => {
      msg.value++
    }

    const addCount = () => {
      count.value++
    }

    return {
      msg,
      count,
      changeMsg,
      addCount
    }
  },
  render() {
    return h('div', {}, [
      h(Child, { msg: this.msg }),
      h('button', { onClick: this.changeMsg }, 'change msg'),
      h('div', {}, `count:${this.count}`),
      h('button', {  onClick: this.addCount }, 'change count')
    ])
  }
}