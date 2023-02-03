'use strict';

const extend = Object.assign;
const isObject = value => {
    return value !== null && typeof value === 'object';
};
// 判断是否是以on开头
const isOn = (key) => {
    return /^on[A-Z]/.test(key);
};
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

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

function initProps(instance, rawProps) {
    console.log('rawProps', rawProps);
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    '$el': (i) => i.vnode.el
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {}
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // initSlots()
    setupStatefulComponent(instance);
}
// 初始化有状态的组件
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props));
        handleSetupResult(instance, setupResult);
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

function render(vnode, container) {
    // patch
    patch(vnode, container);
}
function patch(vnode, container) {
    // 处理组件
    // TODO
    const { shapeFlags } = vnode;
    if (shapeFlags & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const { type, children, props, shapeFlags } = vnode;
    const el = (vnode.el = document.createElement(type));
    if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(el, children);
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
function mountChildren(el, children) {
    children.forEach(item => {
        patch(item, el);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode
    patch(subTree, container);
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
    return vnode;
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

exports.createApp = createApp;
exports.h = h;