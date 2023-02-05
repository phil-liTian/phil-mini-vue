import { h, ref } from "../../lib/mini-vue.esm.js"

export const TextToArray = {
  setup() {
    window.isChanged = ref(false)
    return {}
  },
  render() {
    const A = h('p', {}, 'A')
    const B = h('p', {}, 'B')

    return h('div', {}, window.isChanged.value ? [A, B] : 'oldChilren')
  }
}
