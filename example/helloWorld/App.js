import { h } from "../../lib/mini-vue.esm.js"

export const App = {
  setup() {
    return {
      msg: 'hello custom render'
    }
  },
  render() {
    return h('div', {}, [h('h4', {}, '自定义渲染器' + this.msg)])
  }
}