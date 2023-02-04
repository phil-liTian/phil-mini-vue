const extend = Object.assign;
const isObject = value => {
    return value !== null && typeof value === 'object';
};
// 判断是否是以on开头
const isOn = (key) => {
    return /^on[A-Z]/.test(key);
};
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
// 将肉串样式转化成驼峰
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const isArray = Array.isArray;

// 依赖收集
let targetMap = new Map();
function triggerEffects(deps) {
    for (const effect of deps) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
// 触发依赖
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let deps = depsMap.get(key);
    triggerEffects(deps);
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
// 创建getter
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // 不是readonly就是reacitve
        if (key === "__v_isReactive" /* ReactiveFlag.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlag.IS_READONLY */) {
            // 判断是否是只读的
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
// 创建setter
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandler = {
    get: readonlyGet,
    set() {
        console.warn('not allowed set when data is readonly');
        return true;
    }
};
const shallowReadonlyHandler = extend({}, readonlyHandler, { get: shallowReadonlyGet });

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandler);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandler);
}
// 创建响应式对象
function createReactiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}

function emit(instance, event, ...args) {
    const props = instance.props;
    // TPP 的开发思想： 先写一个特定的行为，然后再重构成通用的行为
    const handleKey = `on${capitalize(camelize(event))}`;
    const handler = props[handleKey];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    '$el': (i) => i.vnode.el,
    '$slots': i => i.slots
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        if (hasOwn(instance.props, key)) {
            return instance.props[key];
        }
        // if( key in setupState) {
        //   return setupState[key]
        // }
        // if(key in instance.props) {
        //   return instance.props[key]
        // }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlags & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(instance.slots, children);
    }
}
function normalizeObjectSlots(slots, children) {
    for (const key in children) {
        const value = children[key];
        if (value) {
            slots[key] = (props) => normalizeSlotValue(value(props));
        }
    }
}
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    console.log('parent', parent);
    let component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
// 初始化有状态的组件
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        handleSetupResult(instance, setupResult);
        setCurrentInstance(null);
    }
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
}
function handleSetupResult(instance, setupResult) {
    // TODO: 实现一个函数
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function render(vnode, container, parent = null) {
    // patch
    patch(vnode, container, parent);
}
function patch(vnode, container, parent) {
    const { shapeFlags } = vnode;
    switch (vnode.type) {
        case Fragment:
            processFragment(vnode, container, parent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlags & 1 /* ShapeFlags.ELEMENT */) {
                processElement(vnode, container, parent);
            }
            else if (shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                // 处理组件
                processComponent(vnode, container, parent);
            }
            break;
    }
}
function processText(vnode, container) {
    const textContent = (vnode.el = document.createTextNode(vnode.children));
    console.log('textContent', textContent);
    container.append(textContent);
}
function processFragment(vnode, container, parent) {
    mountChildren(vnode, container, parent);
}
function processElement(vnode, container, parent) {
    mountElement(vnode, container, parent);
}
function mountElement(vnode, container, parent) {
    const { type, children, props, shapeFlags } = vnode;
    const el = (vnode.el = document.createElement(type));
    if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode, el, parent);
    }
    for (const key in props) {
        const value = props[key];
        if (isOn(key)) {
            const eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, value);
        }
        el.setAttribute(key, value);
    }
    container.append(el);
}
function mountChildren(vnode, container, parent) {
    vnode.children.forEach(item => {
        patch(item, container, parent);
    });
}
function processComponent(vnode, container, parent) {
    mountComponent(vnode, container, parent);
}
function mountComponent(vnode, container, parent) {
    const instance = createComponentInstance(vnode, parent);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode
    patch(subTree, container, instance);
    // console.log('subTree', subTree.el);
    vnode.el = subTree.el;
}

function createVNode(type, props, children) {
    let vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeType(type)
    };
    if (typeof children === 'string') {
        vnode.shapeFlags |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 判断是否slots类型
    // 是组件类型 并且children是一个object
    if (vnode.shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlags |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeType(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            const vNode = createVNode(rootComponent);
            render(vNode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function provide(key, value) {
    // 存 
    let currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides, parent } = currentInstance;
        const parentProvides = parent.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    const { parent } = currentInstance;
    const parentProvides = parent.provides;
    if (defaultValue) {
        if (typeof defaultValue === 'function') {
            return defaultValue();
        }
        return defaultValue;
    }
    return parentProvides[key] || '';
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

export { createApp, createTextVNode, getCurrentInstance, h, inject, provide, renderSlots };
