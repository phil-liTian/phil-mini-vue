import { App } from "./App.js";
import { createApp } from '../../lib/mini-vue.esm.js'

const rooterContainer = document.querySelector('#app');

createApp(App).mount(rooterContainer)
