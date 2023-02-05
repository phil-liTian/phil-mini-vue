const extend = Object.assign;
const isObject = value => {
    return value !== null && typeof value === 'object';
};
const hasChanged = (value, oldValue) => {
    return !Object.is(value, oldValue);
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
const EMPTY_OBJ = {};

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        activeEffect = this;
        shouldTrack = true;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
// 依赖收集
let targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
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
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
// 触发依赖
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let deps = depsMap.get(key);
    triggerEffects(deps);
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function stop(runner) {
    runner.effect.stop();
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
        // 依赖收集
        if (!isReadonly) {
            track(target, key);
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
// 判断是否是reactive
function isReactive(value) {
    return !!value["__v_isReactive" /* ReactiveFlag.IS_REACTIVE */];
}
// 判断是否是只读的
function isReadonly(value) {
    return !!value["__v_isReadonly" /* ReactiveFlag.IS_READONLY */];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
// 创建响应式对象
function createReactiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}

class ComputedRefImpl {
    constructor(getter) {
        this._dirty = true;
        this._effect = new ReactiveEffect(getter, () => {
            if (this._dirty)
                return;
            this._dirty = true;
        });
    }
    get value() {
        if (this._dirty) {
            this._dirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
}
function computed(getter) {
    return new ComputedRefImpl(getter);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefEffects(this);
        return this._value;
    }
    set value(newValue) {
        // 这里比较的时候需要是一个原生的对象, 所以需要暂存一个未转化前的value对象
        if (hasChanged(this._rawValue, newValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerRefEffects(this);
        }
    }
}
function trackRefEffects(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function triggerRefEffects(ref) {
    triggerEffects(ref.dep);
}
// 转化, 当ref中是一个对象的时候，将这个对象转化成响应式对象
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(value) {
    return !!value.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
// 应用场景: 当我们在模板中使用ref定义的变量的时候是不需要.value的
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // Reflect.set(target, key, value)
            // return Reflect.set(target, key, value)
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
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
    let component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
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
        handleSetupResult(instance, proxyRefs(setupResult));
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

// import { render } from "./renderer"
function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vNode = createVNode(rootComponent);
                render(vNode, rootContainer);
            }
        };
    };
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createRender(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options;
    function render(vnode, container, parent = null) {
        // console.log('vnode, container, parent = null', vnode, container, parent);
        // patch
        patch(null, vnode, container, parent);
    }
    /**
     *
     * @param n1 初始化的vnode
     * @param n2 新的vnode
     * @param container 容器
     * @param parent 父组件
     */
    function patch(n1, n2, container, parent) {
        const { shapeFlags } = n2;
        switch (n2.type) {
            case Fragment:
                processFragment(n1, n2, container, parent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlags & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parent);
                }
                else if (shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 处理组件
                    processComponent(n2, container, parent);
                }
                break;
        }
    }
    function processText(n1, vnode, container) {
        const textContent = (vnode.el = document.createTextNode(vnode.children));
        console.log('textContent', textContent);
        container.append(textContent);
    }
    function processFragment(n1, vnode, container, parent) {
        mountChildren(n1, vnode, container, parent);
    }
    function processElement(n1, vnode, container, parent) {
        if (n1) {
            // 走更新逻辑
            updateElement(n1, vnode);
        }
        else {
            mountElement(n1, vnode, container, parent);
        }
    }
    // 初始化element
    function mountElement(n1, vnode, container, parent) {
        const { type, children, props, shapeFlags } = vnode;
        const el = (vnode.el = hostCreateElement(type));
        if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(n1, vnode, el, parent);
        }
        for (const key in props) {
            const value = props[key];
            hostPatchProp(el, key, null, value);
            // if( isOn(key) ) {
            //   const eventName = key.slice(2).toLowerCase()
            //   el.addEventListener(eventName, value)
            // }
            // el.setAttribute(key, value)    
        }
        // container.append(el)
        hostInsert(el, container);
    }
    // 更新element
    function updateElement(n1, n2, container) {
        console.log('update');
        console.log('n1', n1);
        console.log('n2', n2);
        // 处理props
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchProps(oldProps, newProps, el);
        // 处理children
    }
    function patchProps(oldProps, newProps, el) {
        // console.log('oldProps, newProps', oldProps, newProps);
        // 第一种情况，改变props的值
        for (const key in newProps) {
            const nextProp = newProps[key];
            const prevProp = oldProps[key];
            if (nextProp !== prevProp) {
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
        // 第三种情况 删除了prop
        if (oldProps !== EMPTY_OBJ) {
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null);
                }
            }
        }
    }
    function mountChildren(n1, vnode, container, parent) {
        vnode.children.forEach(item => {
            patch(n1, item, container, parent);
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
        effect(() => {
            // console.log('instance', instance);
            if (!instance.isMounted) {
                // init
                const subTree = instance.render.call(proxy);
                instance.subTree = subTree;
                // vnode
                patch(null, subTree, container, instance);
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                // update
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
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

function createElement(type) {
    // console.log('createElement-----');
    return document.createElement(type);
}
function patchProp(el, key, oldValue, value) {
    console.log('oldValue, value', oldValue, value);
    // console.log('patchProp-----');
    if (isOn(key)) {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, value);
    }
    // 第二种情况将value设置成undefined、null
    if (value == undefined || value == null) {
        el.removeAttribute(key);
    }
    else {
        el.setAttribute(key, value);
    }
}
function insert(el, container) {
    // console.log('insert-----');
    container.append(el);
}
const renderer = createRender({
    createElement,
    patchProp,
    insert
});
const createApp = (...args) => {
    // console.log('args', args);
    return renderer.createApp(...args);
};

export { ReactiveEffect, computed, createApp, createRender, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, provide, reactive, readonly, ref, renderSlots, stop, unRef };
