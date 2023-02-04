import { createVNode } from "../vnode";

export function renderSlots(slots, name, props) {
  const slot = slots[name]
  console.log('slot', slot);
  

  if( slot ) {
    if( typeof slot === 'function' ) {
      return createVNode('div', {}, slot(props))
    }
  } 
} 
