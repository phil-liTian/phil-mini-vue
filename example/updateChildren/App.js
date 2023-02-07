import { h } from '../../lib/mini-vue.esm.js'
import { TextToArray } from './TextToArray.js'
import { ArrayToText } from './ArrayToText.js'
import { TextToText } from './TextToText.js'
import { ArrayToArray } from './ArrayToArray.js'

/**
 * 由于children存在两种类型(Text, Array)，所以更新children需要分四种情况
 * 
 * 旧children是text，新节点是Array: textToArray
 * 旧children是text，新节点也是text: textToText
 * 旧children是Array, 新节点是text: arrayToText
 * 旧children是Array, 新节点也是Array: arrayToArray
 * 
 */

export const App = {
  setup() {
    return {}
  },

  render() {
    const p = h('p', {},  '实现children元素更新')
    const title = h('h4', {}, [p])

    return h('div', {}, 
      [ title, 
        // h(ArrayToText) 
        // h(TextToArray) 
        h(ArrayToArray)
      ]
    )
  }
}