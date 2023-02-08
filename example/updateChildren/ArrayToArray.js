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
// const originalArr = [
//   h('div', { key: 1 }, 'A'),
//   h('div', { key: 2 }, 'B'),
// ]

// const newArr = [
//   h('div', { key: 3 }, 'C'),
//   h('div', { key: 4 }, 'D'),
//   h('div', { key: 1 }, 'A'),
//   h('div', { key: 2 }, 'B'),
// ]

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


// 5.1.1
// a,b,(c,e,d),f,g
// a,b,(e,c),f,g
// 中间部分，老的比新的多， 那么多出来的直接就可以被干掉(优化删除逻辑)
// const originalArr = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C", id: "c-prev" }, "C"),
//   h("p", { key: "E" }, "E"),
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "F" }, "F"),
//   h("p", { key: "G" }, "G"),
// ];

// const newArr = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "E" }, "E"),
//   h("p", { key: "C", id:"c-next" }, "C"),
//   h("p", { key: "F" }, "F"),
//   h("p", { key: "G" }, "G"),
// ];

// 5.1.1
// a,b,(c,e,d),f,g
// a,b,(e,c),f,g
// 中间部分，老的比新的多， 那么多出来的直接就可以被干掉(优化删除逻辑)
// const originalArr = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C", id: "c-prev" }, "C"),
//   h("p", { key: "E" }, "E"),
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "F" }, "F"),
//   h("p", { key: "G" }, "G"),
// ];

// const newArr = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "E" }, "E"),
//   h("p", { key: "C", id:"c-next" }, "C"),
//   h("p", { key: "F" }, "F"),
//   h("p", { key: "G" }, "G"),
// ];

// 2 移动 (节点存在于新的和老的里面，但是位置变了)

// 2.1
// a,b,(c,d,e),f,g
// a,b,(e,c,d),f,g
// 最长子序列： [1,2]

// const originalArr = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "E" }, "E"),
//   h("p", { key: "F" }, "F"),
//   h("p", { key: "G" }, "G"),
// ];

// const newArr = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "E" }, "E"),
//   h("p", { key: "C" }, "C"),
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "F" }, "F"),
//   h("p", { key: "G" }, "G"),
// ];

// 综合例子
// a,b,(c,d,e,z),f,g
// a,b,(d,c,y,e),f,g

const originalArr = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "C" }, "C"),
  h("p", { key: "D" }, "D"),
  h("p", { key: "E" }, "E"),
  h("p", { key: "Z" }, "Z"),
  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G"),
];

const newArr = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "D" }, "D"),
  h("p", { key: "C" }, "C"),
  h("p", { key: "Y" }, "Y"),
  h("p", { key: "E" }, "E"),
  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G"),
];

export const ArrayToArray = {
  setup() {
    window.isChanged = ref(false)
    return {}
  },
  render() {
    return h('div', {}, isChanged.value ? newArr : originalArr)
  }
}