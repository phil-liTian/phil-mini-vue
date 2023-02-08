import { h } from "../../lib/mini-vue.esm.js"

export const Child = {
  setup() {
    return {}
  },
  render() {
    return h('p', {}, `child: ${this.$props.msg}`)
  }
}