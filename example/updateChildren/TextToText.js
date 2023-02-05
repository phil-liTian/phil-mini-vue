import { h, ref } from "../../lib/mini-vue.esm.js"


export const TextToText = {
  setup() {
    window.isChanged = ref(false)
    return {}
  },
  render() {
   
    return h('div', {}, window.isChanged.value ? 'new text' : 'old text')
  }
}