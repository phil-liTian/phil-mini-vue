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
    '$slots': i => i.slots,
    '$props': i => i.props
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
        next: null,
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

function shouldUpdateComponent(n1, n2) {
    const { props: prevProps } = n1;
    const { props: nextProps } = n2;
    for (const key in nextProps) {
        if (prevProps[key] !== nextProps[key]) {
            return true;
        }
    }
    return false;
}

function createVNode(type, props, children) {
    let vnode = {
        type,
        props,
        children,
        key: props === null || props === void 0 ? void 0 : props.key,
        component: null,
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
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
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
    function patch(n1, n2, container, parent, anchor = null) {
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
                    processElement(n1, n2, container, parent, anchor);
                }
                else if (shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 处理组件
                    processComponent(n1, n2, container, parent);
                }
                break;
        }
    }
    function processText(n1, vnode, container) {
        const textContent = (vnode.el = document.createTextNode(vnode.children));
        container.append(textContent);
    }
    function processFragment(n1, vnode, container, parent) {
        mountChildren(n1, vnode.children, container, parent);
    }
    function processElement(n1, vnode, container, parent, anchor) {
        if (n1) {
            // 走更新逻辑
            updateElement(n1, vnode, container, parent, anchor);
        }
        else {
            mountElement(n1, vnode, container, parent, anchor);
        }
    }
    // 初始化element
    function mountElement(n1, vnode, container, parent, anchor) {
        const { type, children, props, shapeFlags } = vnode;
        // console.log('type', hostCreateElement(type));
        const el = (vnode.el = hostCreateElement(type));
        if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(n1, vnode.children, el, parent);
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
        hostInsert(el, container, anchor);
    }
    // 更新element
    function updateElement(n1, n2, container, parentComponent, anchor) {
        // 处理props
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchProps(oldProps, newProps, el);
        // 处理children
        patchChildren(n1, n2, el, parentComponent, anchor);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlags: prevShapeFlags, children: c1 } = n1;
        const { shapeFlags, children: c2 } = n2;
        // 新children是text类型
        if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 之前的children是array类型的
            if (prevShapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 删除原来的数组类型的children
                unmountChildren(c1);
                // 设置children内容是text
                // hostSetElementText(c2, container)
            }
            // 都是text
            if (c1 !== c2) {
                hostSetElementText(c2, container);
            }
        }
        else {
            if (prevShapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // 新的是一个数组，老的是一个文本节点
                hostSetElementText('', container);
                mountChildren(n1, n2.children, container, parentComponent);
            }
            else {
                // 处理原来的children和新children都是array的情况
                patchedKeyedChildren(n1, n2, container, parentComponent, anchor);
            }
        }
    }
    function patchedKeyedChildren(n1, n2, container, parentComponent, parentAnchor) {
        const c1 = n1.children;
        const c2 = n2.children;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        const l2 = c2.length;
        // 结合type和key判断是否是相同节点，至于使用到key是为了优化比较性能
        function isSameNodeType(n1, n2) {
            return n1.key === n2.key && n1.type === n2.type;
        }
        // 左 => 右
        while (i <= Math.min(e1, e2)) {
            const prevChild = c1[i];
            const nextChild = c2[i];
            // 节点相同
            if (!isSameNodeType(prevChild, nextChild)) {
                break;
            }
            patch(prevChild, nextChild, container, parentComponent);
            i++;
        }
        // 右 => 左
        while (i <= Math.min(e1, e2)) {
            const prevChild = c1[e1];
            const nextChild = c2[e2];
            // 节点相同
            if (!isSameNodeType(prevChild, nextChild)) {
                break;
            }
            patch(prevChild, nextChild, container, parentComponent);
            e1--;
            e2--;
        }
        if (i > e1 && i <= e2) {
            // 新的比旧的长 需要创建新节点
            const nextIdx = e2 + 1;
            const anchor = nextIdx < l2 ? c2[nextIdx].el : null;
            // 创建新节点
            while (i <= e2) {
                console.log(`新的比旧的长，需要创建新vnode:${c2[i].key}`);
                patch(null, c2[i], container, parentComponent, anchor);
                i++;
            }
        }
        else if (i > e2 && i <= e1) {
            // 新的比旧的短 需要删除节点
            while (i <= e1) {
                console.log(`新的比旧的短，需要删除vnode:${c1[i].key}`);
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 处理乱序的情况
            const s1 = i;
            const s2 = i;
            // 处理优化的地方
            // 待处理的节点总数
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            let moved = false;
            let maxNewIndexSoFar = 0;
            // 创建一个map结构，为新节点的key和index的映射关系, 
            const keyToNewIndexMap = new Map();
            // 初始化旧节点到新节点的映射关系
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            for (let i = s2; i <= e2; i++) {
                const newChild = c2[i];
                keyToNewIndexMap.set(newChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const oldChild = c1[i];
                // 优化: 如果已经patch过的节点等于待处理的节点总数的话，说明新节点中已经没有还未处理的节点了，则将旧节点中的children直接删除即可
                if (patched >= toBePatched) {
                    hostRemove(oldChild.el);
                    continue;
                }
                // 处理newIndex的匹配逻辑
                let newIndex;
                if (oldChild.key) {
                    // 如果属性中标明了key的话，则直接使用key进行比较，时间复杂度为o(1)
                    newIndex = keyToNewIndexMap.get(oldChild.key);
                }
                else {
                    // 没有指定key，遍历进行比较，时间复杂度为o(n)
                    for (let j = 0; j <= e2; j++) {
                        const newChild = c2[j];
                        if (isSameNodeType(oldChild, newChild)) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (!newIndex) {
                    // 旧节点中的children在新节点中已经不存在了,则删除旧节点
                    hostRemove(oldChild.el);
                }
                else {
                    if (newIndex > maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 有的话需要创建
                    patch(oldChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            const increasingNewIndexMap = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexMap.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = s2 + i;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 >= l2 ? parentAnchor : c2[nextIndex + 1].el;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 说明在旧节点中不存在，需要创建新节点
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || increasingNewIndexMap[j] !== i) {
                        console.log('需要移动位置');
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        // 命中的节点，不需要移动children
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
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
    function mountChildren(n1, children, container, parent) {
        children.forEach(item => {
            patch(null, item, container, parent);
        });
    }
    function processComponent(n1, vnode, container, parent) {
        if (!n1) {
            mountComponent(vnode, container, parent);
        }
        else {
            updateComponent(n1, vnode);
        }
    }
    // 更新组件
    function updateComponent(n1, n2) {
        const instance = n2.component = n1.component;
        if (shouldUpdateComponent(n1, n2)) {
            // 更新成n2
            instance.next = n2;
            instance.update();
        }
        else {
            console.log(`组件不需要更新: ${instance}`);
            n2.component = n1.component;
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(vnode, container, parent) {
        const instance = (vnode.component = createComponentInstance(vnode, parent));
        setupComponent(instance);
        setupRenderEffect(instance, vnode, container);
    }
    function setupRenderEffect(instance, vnode, container) {
        const { proxy } = instance;
        instance.update = effect(() => {
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
                const { next, vnode } = instance;
                if (next) {
                    // 更新组件的内容
                    // next 和 vnode的区别是： 我们此时需要实现的是将vnode => next
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        nextVNode.component = instance;
        instance.vnode = nextVNode;
        instance.next = null;
        // 将nextVNode的props赋值到实例的props上
        instance.props = nextVNode.props;
    }
    return {
        createApp: createAppAPI(render)
    };
}
// 获取最长递增子序列
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
function insert(el, container, anchor = null) {
    // console.log('insert-----');
    // container.append(el)
    container.insertBefore(el, anchor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(child, el) {
    el.textContent = child;
}
const renderer = createRender({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
const createApp = (...args) => {
    // console.log('args', args);
    return renderer.createApp(...args);
};

export { ReactiveEffect, computed, createApp, createRender, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, provide, reactive, readonly, ref, renderSlots, stop, unRef };
