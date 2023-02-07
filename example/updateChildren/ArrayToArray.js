// 在实现原children是一个array，新children也是一个array的时候，采用双端diff算法进行比较

import { h, ref } from "../../lib/mini-vue.esm.js"

/**
 * 左侧游标为i，右侧游标为e1和e2
 * 场景步骤为：
 * 1、左侧对比
 *    (ab)c
 *    (ab)de
 * 
 * 从左向右进行比较，相同则i++，当发现相同i下children不同时，左侧比较结束
 * 
 * 2. 右侧对比
 *    c(ab)
 *   de(ab)
 * 
 * 从右向左进行比较，相同时则e1--、e2--, e对应的值相同时结束比较
 * 
 * 3. 新children比旧children长，
 *    3.1 左侧比较
 *      (ab)c
 *      (ab)
 * 
 *    3.2 右侧比较
 *      c(ab)
 *       (ab)
 * 
 * 4. 新children比旧children短
 *    4.1 左侧比较
 *      (ab)c
 *      (ab)
 * 
 *    4.2 右侧比较
 *      c(ab)
 *       (ab)
 */ 
// 1
// const originalArr = [
//   h('div', { key: 1 }, 'A'),
//   h('div', { key: 2 }, 'B'),
//   h('div', { key: 3 }, 'C')
// ]

// const newArr = [
//   h('div', { key: 1 }, 'A'),
//   h('div', { key: 2 }, 'B'),
//   h('div', { key: 4 }, 'D'),
//   h('div', { key: 5 }, 'E')
// ]


// 2
// const originalArr = [
//   h('div', { key: 1 }, 'A'),
//   h('div', { key: 2 }, 'B'),
//   h('div', { key: 3 }, 'C')
// ]

// const newArr = [
//   h('div', { key: 5 }, 'D'),
//   h('div', { key: 4 }, 'E'),
//   h('div', { key: 2 }, 'B'),
//   h('div', { key: 3 }, 'C')
// ]


// 3
// const originalArr = [
//   h('div', { key: 1 }, 'A'),
//   h('div', { key: 2 }, 'B'),
// ]

// const newArr = [
//   h('div', { key: 1 }, 'A'),
//   h('div', { key: 2 }, 'B'),
//   h('div', { key: 3 }, 'C')
// ]

// 4.
const originalArr = [
  h('div', { key: 1 }, 'A'),
  h('div', { key: 2 }, 'B'),
]

const newArr = [
  h('div', { key: 3 }, 'C'),
  h('div', { key: 4 }, 'D'),
  h('div', { key: 1 }, 'A'),
  h('div', { key: 2 }, 'B'),
]

// 5. 
// const originalArr = [
//   h('div', { key: 1 }, 'A'),
//   h('div', { key: 2 }, 'B'),
//   h('div', { key: 3 }, 'C'),
//   h('div', { key: 4 }, 'D'),
// ]

// const newArr = [
//   h('div', { key: 1 }, 'A'),
//   h('div', { key: 2 }, 'B'),
// ]

export const ArrayToArray = {
  setup() {
    window.isChanged = ref(false)
    return {}
  },
  render() {
    return h('div', {}, isChanged.value ? newArr : originalArr)
  }
}