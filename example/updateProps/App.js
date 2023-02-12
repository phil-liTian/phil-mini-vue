import { h, ref } from "../../lib/mini-vue.esm.js"

export const App = {
  setup() {

    const props = ref({
      foo: 'foo',
      bar: 'bar'
    })

    const changePropsDemo1 = () => {
      props.value.foo = 'foo-demo1'
    }

    const changePropsDemo2 = () => {
      props.value.foo = null
    }

    const changePropsDemo3 = () => {
      props.value = {
        foo: 'foo'
      }
    }


    return {
      props,
      changePropsDemo1,
      changePropsDemo2,
      changePropsDemo3
    }
  },
  render() {
    console.log('this', this.props);
    return h('div', { ...this.props }, [
      h('h4', {}, 'update props'),
      h('button', { onClick: this.changePropsDemo1 }, 'change props'),
      h('button', { onClick: this.changePropsDemo2 }, 'change props demo2'),
      h('button', { onClick: this.changePropsDemo3 }, 'change props demo3'),
    ])
  }
}