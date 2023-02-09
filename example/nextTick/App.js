import { getCurrentInstance, h, ref, nextTick } from '../../lib/mini-vue.esm.js'

export const App = {
  setup() {
    const count = ref(1)
    const instance = getCurrentInstance()
    const onClick = () => {
      for (let i = 0; i < 100; i++) {
        count.value = i        
      }
      debugger
      console.log('instance', instance);
      nextTick(() => {
        console.log('instance', instance);
      })
    }

    return {
      count,
      onClick
    }
  },

  render() {
    return h('div', {}, [
      h('button', { onClick: this.onClick }, 'button'),
      h('div', {}, `count: ${this.count}`)
    ])
  }
}