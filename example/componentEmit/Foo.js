import { h } from "../lib/mini-vue.esm.js"

export const Foo = {
  setup(props) {
    props.count++
  },

  render() {
    return  h('div', {}, 'foo:' + this.count)
  }
}