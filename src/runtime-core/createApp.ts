// import { render } from "./renderer"
import { createVNode } from "./vnode"

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        const vNode = createVNode(rootComponent)
        
        render(vNode, rootContainer)
      }
    }
  }
}

