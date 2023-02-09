const queue: any[] = []
let isFlushPending = false
const p = Promise.resolve()

// 用来实现nextTicker，基本原理为当响应式数据频繁发生变化的时候，不希望频繁掉用patch方法
// 所以在scheduler中收集instance.update, 然后异步执行job，nextTick的原理就是异步代码执行完毕之后
// 再去获取当前组件实例，这时候是可以拿到更新之后的组件实例的
export function nextTick(fn) {
  return fn ? p.then(fn) : p
}

export function queueJobs(job) {
  if( !queue.includes(job) ) {
    queue.push(job)
    queueFlush()
  }
}

function queueFlush() {
  if( isFlushPending )return
  isFlushPending = true
  nextTick(flushJobs)
}

function flushJobs() {
  let job
  isFlushPending = false
  while((job = queue.shift())) {
    job && job()
  }
}
