import { h, ref } from "../../lib/mini-vue.esm.js"

export const App = {
  setup() {

    const count = ref(1)

    const add = () => {
      // console.log('add');
      count.value++ 
    }


    return {
      count,
      add
    }
  },
  render() {
    return h('div', {}, [
      h('h4', {}, 'update element'),
      h('div', {}, `count:${this.count}`),
      h('button', { onClick: this.add }, 'click')
    ])
  }
}