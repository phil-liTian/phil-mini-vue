import { h, ref } from "../../lib/mini-vue.esm.js"


export const ArrayToText = {
  setup() {
    window.isChanged = ref(false)

    return {
      
    }
  },
  render() {
    // window.isChanged = false

    const A = h('p', {}, 'A')
    const B = h('p', {}, 'B')

    return h('div', {}, window.isChanged.value ? 'new text' : [A, B])
  }
}