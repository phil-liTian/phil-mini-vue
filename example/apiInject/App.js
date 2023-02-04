import { h, provide, inject } from "../../lib/mini-vue.esm.js"

const Consumer = {
  setup() {
    const foo = inject('foo', 'inject的默认值是一个string')
    return { foo }
  },

  render() {
    return h('div', {}, 'consumer + ' + this.foo)
  }
}

const Provider2 = {
  setup() {
    // provide('foo', 'fooTwo')
    const foo = inject('foo', () => 'inject的默认值是一个函数')

    return {
      foo
    }
  },

  render() {
    return h('div', {}, [h(Consumer), h('div', {}, 'Provider2' + this.foo)])
  }
}


const Provider = {
  setup() {
    // provide('foo', 'foo')
    return {}
  },

  render() {
    return h(Provider2)
  }
}


export const App = {
  setup() {
    
    return {
      
    }
  },
  render() {
    return h('div', {}, [
      h('h4', {}, '实现inject和provide'),
      h(Provider)
    ])
  }
}