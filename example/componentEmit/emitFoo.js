import { h } from "../lib/mini-vue.esm.js"

export const EmitFoo = {
  setup(props, { emit }) {
    const add = () => {
      // console.log('add');
      emit('add-foo', 1, 32)
    }

    return {
      add
    }
  },

  render() {
    const btn = h('button', { onClick: this.add }, 'emit')
    const cnt = h('p', {}, '测试emit')
    return h('div', {}, [cnt, btn])
  }
}