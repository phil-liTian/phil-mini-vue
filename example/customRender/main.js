import { createRender } from '../../lib/mini-vue.esm.js'
import { App } from './app.js'

const game = new PIXI.Application({
  width: 500,
  height: 500
})
document.body.append(game.view)

const renderer = createRender({
  createElement: (type) => {
    console.log('type', type);
    if( type === 'rect' ) {
      const rect = new PIXI.Graphics()
      rect.beginFill(0xff0000)
      rect.drawRect(0, 0, 100, 100)
      rect.endFill()
      console.log('rect', rect);
      return rect
    }
  },
  patchProp(el, key, value) {
    el[key] = value
  },
  insert(el, parent) {
    parent.addChild(el)
  }
})

renderer.createApp(App).mount(game.stage)

