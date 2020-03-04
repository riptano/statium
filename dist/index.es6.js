import React, { useContext } from 'react';
import loGet from 'lodash.get';
import loSet from 'lodash.set';
import loHas from 'lodash.has';
import loClone from 'lodash.clone';
import upperFirst from 'lodash.upperfirst';

const error = msg => {
    if (process.env.NODE_ENV === 'production') {
        console.error(msg);
    }
    else {
        throw new Error(msg);
    }
};

const defaultGet = key => {
    error(`Failed to retrieve a value for key "${key}", no ViewModel found`);
};

const defaultSet = (key, value) => {
    error(`Failed to set key "${key}", no ViewModel found. Value: ${JSON.stringify(value)}`);
};

const defaultDispatch = (event, ...payload) => {
    error(`Cannot find handler for event "${event}". Event arguments: ${JSON.stringify(payload)}`);
};

const rootViewModel = {
    formulas: {},
    data: {},
    state: {},
    store: {},
    $get: defaultGet,
    $set: defaultSet,
    $retrieve: key => rootViewModel.$get(key),
    $dispatch: defaultDispatch,
};

const rootViewController = {
    $get: rootViewModel.$retrieve,
    $set: rootViewModel.$set,
    $dispatch: defaultDispatch,
};

// One often encountered problem is package being included more than once
// in the application bundle, due to bundler misconfiguration or some other
// reason. If that happens, each copy of the Statium package will have its own
// pair of private ViewModel and ViewController contexts; this will lead to
// _seriously_ hairy bugs that are really hard to track.
// To avoid this issue, we simply cache context objects in the window.
const ViewModelContext = (() => {
    let context;
    
    try {
        if (window.__$StatiumViewModelContext) {
            context = window.__$StatiumViewModelContext;
        }
        else {
            context = React.createContext({ vm: rootViewModel });
            window.__$StatiumViewModelContext = context;
        }
    }
    catch (e) {
        context = React.createContext({ vm: rootViewModel });
    }
    
    return context;
})();

const ViewControllerContext = (() => {
    let context;
    
    try {
        if (window.__$StatiumViewControllerContext) {
            context = window.__$StatiumViewControllerContext;
        }
        else {
            context = window.__$StatiumViewControllerContext =
                React.createContext(rootViewController);
        }
    }
    catch (e) {
        context = React.createContext(rootViewController);
    }
    
    return context;
})();

let idCounter = 0;

const getId = prefix => `${prefix}-${++idCounter}`;

const chain = (proto, ...sources) => Object.assign(Object.create(proto), ...sources);

const setterNameForKey = key => `set${upperFirst(key)}`;

const getKeys = object =>
    [].concat(Object.getOwnPropertySymbols(object), Object.getOwnPropertyNames(object));
    
const getKeyPrefix = key =>
    typeof key === 'symbol' ? key : String(key).split('.').shift();

const validKey = key =>
    (typeof key === 'string' && key !== '') || typeof key === 'symbol';

const findOwner = (object, entityName, key) => {
    let depth = 0;
    
    for (let owner = object; owner; owner = owner.parent) {
        const entity = owner[entityName];
        
        if (typeof entity === 'object' && entity.hasOwnProperty(key)) {
            return [owner, depth];
        }
        
        depth++;
    }
    
    return [null];
};

const normalizeProtectedKey = entry => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        if (!('key' in entry)) {
            throw new Error(`Invalid protected key entry: ${JSON.stringify(entry)}`);
        }
        
        const { key, event } = entry;
        
        if (!validKey(key)) {
            throw new Error(`Invalid protected key: ${JSON.stringify(key)}`);
        }
        
        if (typeof key === 'symbol' && !validKey(event)) {
            throw new Error(`Protected key ${String(key)} requires event name.`);
        }
        
        if (!validKey(event)) {
            throw new Error(`Invalid event name for protected key "${String(key)}": ${JSON.stringify(event)}`);
        }
        
        return [key, event || setterNameForKey(key)];
    }
    else if (validKey(entry)) {
        if (typeof entry === 'symbol') {
            throw new Error(`Protected key ${String(entry)} requires event name.`);
        }
        
        return [entry, setterNameForKey(entry)];
    }
    
    throw new Error(`Invalid protected key: ${JSON.stringify(entry)}`);
};

const normalizeProtectedKeys = keys => {
    let validatedKeys;
    
    if (validKey(keys)) {
        const [key, event] = normalizeProtectedKey(keys);
        
        validatedKeys = { [key]: event };
    }
    else if (keys && typeof keys === 'object') {
        if (Array.isArray(keys)) {
            validatedKeys = keys.reduce((acc, entry) => {
                const [key, event] = normalizeProtectedKey(entry);
                
                acc[key] = event;
                
                return acc;
            }, {});
        }
        else {
            validatedKeys = {};
            
            for (const key of getKeys(keys)) {
                const event = keys[key];
                const [validatedKey, validatedEvent] = normalizeProtectedKey({ key, event });
                
                validatedKeys[validatedKey] = validatedEvent;
            }
        }
    }
    else {
        throw new Error(`Invalid protected keys: ${JSON.stringify(keys)}`);
    }
    
    return validatedKeys;
};

const defer = (fn, timeout = 0) => setTimeout(fn, timeout);

const normalizeBindings = (bindings = {}) => {
    if (!bindings || !(typeof bindings === 'object' || validKey(bindings))) {
        throw new Error(`Invalid bindings: ${JSON.stringify(bindings)}`);
    }
    
    if (validKey(bindings)) {
        bindings = [bindings];
    }
    
    if (Array.isArray(bindings)) {
        bindings = bindings.reduce((map, propName) => {
            if (validKey(propName)) {
                map[propName] = propName;
            }
            else if (Array.isArray(propName)) {
                const [key, publish = false] = propName;
                
                // prop name is the same as key in this case
                map[key] = { key, publish };
            }
            else if (typeof propName === 'object') {
                let { prop, key, publish = false, ...rest } = propName;
                
                if (!validKey(key)) {
                    throw new Error("The 'key' field is required for a binding: " +
                                    JSON.stringify(propName));
                }
                
                prop = validKey(prop) ? prop : key;
                
                map[prop] = { ...rest, key, publish };
            }
            
            return map;
        }, {});
    }
    
    return getKeys(bindings).map(propName => {
        const binding = bindings[propName];
        
        if (validKey(binding)) {
            return { propName, key: binding, publish: false };
        }
        else if (typeof binding === 'function') {
            return { propName, key: propName, formula: binding };
        }
        else if (typeof binding === 'object') {
            let { key, publish, formula, setterName } = binding;
            
            if (formula && typeof formula !== 'function') {
                throw new Error(`Invalid formula definition: ${JSON.stringify(formula)}`);
            }
            
            if ('publish' in binding && typeof publish !== 'boolean') {
                throw new Error(`Invalid publish value: ${JSON.stringify(publish)}. Should be 'true' or 'false'.`);
            }
            
            if (publish && typeof key === 'symbol' && !setterName) {
                throw new Error("Setter function name is required for publishing Symbol " +
                                "keys in a ViewModel. Published key: " + String(key));
            }
            
            return {
                propName,
                key: key || propName,
                publish,
                ...publish ? { setterName: setterName || setterNameForKey(propName) } : {},
                ...formula ? { formula } : {},
            };
        }
        else {
            // TODO Better error handling
            throw new Error('Invalid bound prop definition');
        }
    });
};

const mapProps = (vm, bindings) =>
    bindings.reduce((out, binding) => {
        const { propName, key, formula, publish, setterName } = binding;
        
        out[propName] = formula ? formula(vm.$retrieve) : vm.$retrieve(key);
        
        if (publish) {
            out[setterName] = vm.getKeySetter(vm, key);
        }
        
        return out;
    }, {});

const mapPropsToArray = (vm, bindings) =>
    bindings.map(binding => {
        const { key, formula, publish } = binding;
        
        const value = formula ? formula(vm.$retrieve) : vm.$retrieve(key);
        
        if (!publish) {
            return value;
        }
        
        const setter = vm.getKeySetter(vm, key);
        
        return [value, setter];
    });

const accessorType = Symbol('accessorType');

const retrieve = (vm, key) =>
    vm.formulas[key] ? vm.formulas[key](vm.$retrieve) : vm.$get(key);

const getter = (vm, key) => loGet(vm.store, key);

const getStateKeyOwner = (vm, key) => {
    const prefix = getKeyPrefix(key);
    
    const [owner, depth] = findOwner(vm, 'state', prefix);
    
    // If no owner was found, the key does not exist up the prototype chain.
    // This means we can't set it.
    if (owner === null) {
        throw new Error(
            `Cannot find owner ViewModel for key ${key}. You need to provide ` +
            `initial value for this key in "initialState" prop.`
        );
    }
    
    return [owner, depth];
};

const setter = (vm, key, value) => {
    const [owner] = getStateKeyOwner(vm, key);
    
    if (owner.protectedKeys && key in owner.protectedKeys) {
        const event = owner.protectedKeys[key];
        
        return owner.$dispatch(event, value);
    }
    else {
        return owner.setState({ [key]: value });
    }
};

const multiGet = (vm, keys) => {
    let objectSyntax = false;
    
    if (keys.length === 1) {
        // Trivial case when getter invoked with one string key name, thusly:
        // const foo = $get('foo')
        if (validKey(keys[0])) {
            return vm.$retrieve(keys[0]);
        }
        else if (typeof keys[0] === 'object') {
            keys = keys[0];
        
            if (!Array.isArray(keys)) {
                objectSyntax = true;
            }
        }
    }
    
    const bindings = normalizeBindings(keys);
    
    return objectSyntax ? mapProps(vm, bindings) : mapPropsToArray(vm, bindings);
};

const multiSet = ({ vm, forceKey }, key, value) => {
    let kv;
    
    if (key && typeof key === 'object' && !Array.isArray(key)) {
        kv = key;
    }
    else if (validKey(key)) {
        kv = {
            [key]: value
        };
    }
    
    if (!kv) {
        throw new Error(`Invalid arguments: key "${JSON.stringify(key)}", `+
                        `value: "${JSON.stringify(value)}"`);
    }
    
    const ownerMap = new Map();
    
    for (const k of getKeys(kv)) {
        const [owner, depth] = getStateKeyOwner(vm, k);
        
        let o = ownerMap.get(owner);
        
        if (o == null) {
            o = {
                owner,
                depth,
                values: {},
                protectedValues: {},
            };
            
            ownerMap.set(owner, o);
        }
        
        if (owner.protectedKeys && k in owner.protectedKeys && k !== forceKey) {
            o.protectedValues[k] = kv[k];
        }
        else {
            o.values[k] = kv[k];
        }
    }
    
    const sortedQueue = [...ownerMap.values()].sort((a, b) => {
        // Shouldn't ever happen but hey...
        if (process.env.NODE_ENV !== 'production') {
            if (a.depth === b.depth) {
                throw new Error(`Two owner ViewModels of equal depth?!`);
            }
        }
        
        return a.depth < b.depth ? 1 : -1;
    });
    
    const promises = [];
    
    for (const item of sortedQueue) {
        const { owner, values, protectedValues } = item;
        
        for (const protectedKey of getKeys(protectedValues)) {
            const protectedValue = protectedValues[protectedKey];
            const event = owner.protectedKeys[protectedKey];
            
            promises.push(owner.$protectedDispatch(protectedKey, event, protectedValue));
        }
        
        promises.push(owner.setState(values));
    }
    
    return Promise.all(promises);
};

const accessorizeViewModel = vm => {
    vm.$retrieve = key => retrieve(vm, key);
    vm.$retrieve[accessorType] = 'retrieve';
    
    vm.$get = key => getter(vm, key);
    vm.$get[accessorType] = 'get';
    
    vm.$multiGet = (...args) => multiGet(vm, args);
    vm.$multiGet[accessorType] = 'get';
    
    vm.$set = (...args) => setter(vm, ...args);
    vm.$set[accessorType] = 'set';
    
    vm.$dispatch = vm.$dispatch || vm.parent.$dispatch;
    vm.$protectedDispatch = vm.$protectedDispatch || vm.parent.$protectedDispatch;
    
    return vm;
};

const validateInitialState = (state, vm) => {
    if (state && typeof state === 'object' && !Array.isArray(state)) {
        for (const key of getKeys(state)) {
            if (key in vm.parent.state) {
                const [owner] = getStateKeyOwner(vm, key);
                
                if (owner) {
                    console.warn(
                        `initialState for ViewModel "${vm.id}" contains key "${key}" ` +
                        `that overrides another key with similar name provided by ` +
                        `parent ViewModel "${owner.id}".`
                    );
                }
            }
        }
        
        return true;
    }
    
    throw new Error(`Invalid initialState: ${JSON.stringify(state)}`);
};

const _jsxFileName = "/Users/nohuhu/dev/statium/src/ViewController.js";
// The purpose of this function is to expose an API while decoupling from the actual
// ViewController context object.
const expose = ({ $get, $set, $dispatch }) => ({
    $get,
    $set,
    $dispatch,
});

const dispatcher = ({ vc, protectedKey, event, payload }) => {
    const [owner] = findOwner(vc, 'handlers', event);
    const handler = owner && owner.handlers[event];
    
    if (typeof handler === 'function') {
        // If the event is a protected key event, we need to massage the setter function
        // passed into the handler, so that trying to $set(protectedKey, value) from
        // within that handler wouldn't dispatch another event.
        // In other words, within a protected key event handler, it is possible to set
        // *only* that key directly, while any other keys are going to to through
        // the usual routine.
        if (protectedKey) {
            vc = {
                ...vc,
                $set: (...args) => vc.$protectedSet(protectedKey, ...args),
            };
        }
        
        return vc.defer(handler, vc, ...payload);
    }
    else {
        return rootViewController.$dispatch(event, ...payload);
    }
};

const accessorizeViewController = (vm, vc) => {
    vc.$get = (...args) => multiGet(vm, args);
    vc.$get[accessorType] = 'get';
    
    vc.$set = (...args) => multiSet({ vm }, ...args);
    vc.$set[accessorType] = 'set';
    
    vc.$protectedSet = (forceKey, ...args) => multiSet({ vm, forceKey }, ...args);
    vc.$protectedSet[accessorType] = 'set';
    
    vc.$dispatch = (event, ...payload) => dispatcher({ vc, event, payload });
    vc.$dispatch[accessorType] = 'dispatch';
    
    vc.$protectedDispatch = (protectedKey, event, ...payload) =>
        dispatcher({ vc, protectedKey, event, payload });
    
    vc.$protectedDispatch[accessorType] = 'dispatch';
    
    return vc;
};

class ViewController extends React.Component {
    constructor(props) {
        super(props);
        
        this.id = 'id' in props      ? props.id
                : 'ownerId' in props ? `${props.ownerId}-controller`
                :                      getId('ViewController')
                ;
        
        this.timerMap = new Map();
        this.defer = this.defer.bind(this);
        this.runRenderHandlers = this.runRenderHandlers.bind(this);
    }
    
    componentWillUnmount() {
        for (const timer of this.timerMap.values()) {
            clearTimeout(timer);
        }
        
        this.timerMap.clear();
    }
    
    defer(fn, vc, ...args) {
        let timer = this.timerMap.get(fn);
        
        if (timer) {
            clearTimeout(timer);
            this.timerMap.delete(fn);
        }
        
        const promise = new Promise((resolve, reject) => {
            timer = defer(() => {
                try {
                    const result = fn(expose(vc), ...args);
                    
                    resolve(result);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
        
        this.timerMap.set(fn, timer);
        
        return promise;
    }
    
    runRenderHandlers(vc, props) {
        const me = this;
        
        const { initialize, invalidate } = props;
        
        if (!me.$initialized) {
            if (typeof initialize === 'function') {
                const initializeWrapper = me.$initializeWrapper ||
                    (me.$initializeWrapper = (...args) => {
                        // Initializer function is possibly making changes to the
                        // parent ViewModel state, which might cause extra rendering
                        // of this ViewController. To avoid extraneous invocations
                        // of the initializer function, clear the flags before invoking it.
                        me.$initialized = true;
                        delete me.$initializeWrapper;
                        
                        initialize(...args);
                    });
                
                // We have to defer executing the function because setting state
                // is prohibited during rendering cycle.
                me.defer(initializeWrapper, vc);
            }
            else {
                me.$initialized = true;
            }
        }
        else {
            // Same as `initialize`, we need to run `invalidate`
            // out of event loop.
            if (typeof invalidate === 'function') {
                me.defer(invalidate, vc);
            }
        }
    }
    
    render() {
        const me = this;
        
        const { id, $viewModel, handlers, children } = me.props;
        
        const innerVC = ({ vm }) => 
            React.createElement(ViewControllerContext.Consumer, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 151}}
                ,  parent => {
                    const vc = accessorizeViewController(vm, {
                        id: id || me.id,
                        parent,
                        handlers,
                        defer: me.defer,
                    });
                    
                    // ViewModel needs dispatcher reference to fire events
                    // for corresponding protected keys.
                    vm.$dispatch = vc.$dispatch;
                    vm.$protectedDispatch = vc.$protectedDispatch;
                    
                    // We *need* to run initialize and invalidate handlers during rendering,
                    // as opposed to a lifecycle method such as `componentDidMount`.
                    // The purpose of these functions is to do something that might affect
                    // parent ViewModel state, and we need to have the `vm` ViewModel
                    // object reference to be able to do that. `vm` comes either from
                    // ViewModelContext, or directly injected by parent ViewModel,
                    // but in each case that happens during rendering cycle,
                    // not before or after.
                    me.runRenderHandlers(vc, me.props);
                    
                    return (
                        React.createElement(ViewControllerContext.Provider, { value: vc, __self: this, __source: {fileName: _jsxFileName, lineNumber: 176}}
                            ,  children 
                        )
                    );
                }
            );
    
        return $viewModel
            ? innerVC({ vm: $viewModel })
            : React.createElement(ViewModelContext.Consumer, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 185}}
                ,  innerVC 
              );
    }
}

const _jsxFileName$1 = "/Users/nohuhu/dev/statium/src/ViewModel.js";
const dotRe = /\./;

const applyViewModelState = (currentState, values) => {
    const newState = { ...currentState };
    
    let updated = false;
    
    for (const key of getKeys(values)) {
        const value = values[key];
        
        // Cheaper operation if no deep inspection is necessary.
        if (typeof key === 'symbol' || !dotRe.test(key)) {
            if (!Object.is(currentState[key], value)) {
                newState[key] = value;
                updated = true;
            }
        }
        else {
            const hasKey = loHas(currentState, key);
            const oldValue = loGet(currentState, key);
    
            // All this awkward gymnastics with cloning is to force ViewModel re-render
            // upon value change. 
            // TODO Come up with a better way to solve this problem.
            if (!hasKey || !Object.is(oldValue, value)) {
                const prefix = getKeyPrefix(key);
                const copy = loClone(currentState[prefix]);
            
                newState[prefix] = copy;
                loSet(newState, key, value);
            
                updated = true;
            }
        }
    }
    
    return updated ? newState : currentState;
};

class ViewModelState extends React.Component {
    static getDerivedStateFromProps(props, localState) {
        const { vm, applyState } = props;
        
        if (applyState) {
            const result = applyState(localState, vm.$multiGet);
            
            // If applyState() does not return a value, result will be `undefined`.
            // React complains about this, loudly; returning `null` instead is ok.
            return result == null ? null : result;
        }
        
        return null;
    }
    
    constructor(props) {
        super(props);
        
        this.setViewModelState = this.setViewModelState.bind(this);
        this.getKeySetter = this.getKeySetter.bind(this);
        
        let { initialState, protectedKeys, vm } = props;
        
        if (protectedKeys != null) {
            this.protectedKeys = normalizeProtectedKeys(protectedKeys);
        }
        
        if (typeof initialState === 'function') {
            initialState = initialState(vm.$multiGet);
        }
        
        if (process.env.NODE_ENV !== 'production') {
            validateInitialState(initialState, vm);
        }
        
        this.state = {...initialState};
    }
    
    componentDidUpdate() {
        const { vm, observeStateChange } = this.props;
        
        if (typeof observeStateChange === 'function') {
            observeStateChange(vm.store);
        }
    }
    
    getKeySetter(vm, key) {
        if (!(key in vm.state) && key in vm.data) {
            throw new Error(`Setting read-only key "${String(key)}" is not allowed.`);
        }
        
        const setter = value => vm.$set(key, value);
        setter[accessorType] = 'set';
        
        return setter;
    }
    
    setViewModelState(props) {
        const me = this;
        
        return new Promise(resolve => {
            me.setState(
                state => applyViewModelState(state, props),
                () => { resolve(true); }
            );
        });
    }
    
    render() {
        const me = this;
        
        const { vm, children } = me.props;
        
        vm.state = chain(vm.parent.state, me.state);
        vm.store = chain(vm.parent.store, vm.data, me.state);
        
        vm.protectedKeys = me.protectedKeys;
        vm.getKeySetter = me.getKeySetter;
        vm.setState = me.setViewModelState;
        
        const innerViewModel = (
            React.createElement(ViewModelContext.Provider, { value: { vm }, __self: this, __source: {fileName: _jsxFileName$1, lineNumber: 132}}
                ,  children 
            )
        );
        
        const controller = me.props.controller || (me.protectedKeys ? {} : null);
        
        return !controller
            ? innerViewModel
            : React.createElement(ViewController, { ...controller, $viewModel: vm, ownerId: vm.id, __self: this, __source: {fileName: _jsxFileName$1, lineNumber: 141}}
                    ,  innerViewModel 
              );
    }
}

/*
 * Accepted props:
 *  id, data, initialState, formulas, applyState, observeStateChange, controller,
 *  protectedKeys, children
 */
const ViewModel = props => (
    React.createElement(ViewModelContext.Consumer, {__self: null, __source: {fileName: _jsxFileName$1, lineNumber: 153}}
        ,  ({ vm: parent }) => {
            const formulas = chain(parent.formulas, props.formulas);
            const data = chain(parent.data, props.data);
            const state = chain(parent.state, {});
            
            // At this point, our store contains only data
            const store = chain(parent.store, props.data);
            
            const vm = accessorizeViewModel({
                id: 'id' in props ? props.id : getId('ViewModel'),
                parent,
                formulas,
                data,
                state,
                // This property gets overwritten by ViewModelState.render(); the purpose
                // of having it here is to provide initial store object for applyState()
                // and initialState()
                store,
            });
            
            return (
                React.createElement(ViewModelState, { vm: vm,
                    controller: props.controller,
                    initialState: props.initialState,
                    applyState: props.applyState,
                    observeStateChange: props.observeStateChange,
                    protectedKeys: props.protectedKeys, __self: null, __source: {fileName: _jsxFileName$1, lineNumber: 175}}
                    ,  props.children 
                )
            );
        }
    )
);

ViewModel.defaultProps = {
    data: {},
    initialState: {},
    formulas: {},
    applyState: null,
};

const _jsxFileName$2 = "/Users/nohuhu/dev/statium/src/Bind.js";
// Yes there's a prop named "props". Seemed the most apt name here ¯\_(ツ)_/¯
const Bind = ({ props, controller, children }) => {
    const bindings = normalizeBindings(props);
    
    return (
        React.createElement(ViewModelContext.Consumer, {__self: null, __source: {fileName: _jsxFileName$2, lineNumber: 12}}
            ,  ({ vm }) => !controller
                ? children(mapProps(vm, bindings))
                : React.createElement(ViewControllerContext.Consumer, {__self: null, __source: {fileName: _jsxFileName$2, lineNumber: 15}}
                    ,  vc => children(mapProps(vm, bindings), expose(vc)) 
                  )
            
        )
    );
};

const _jsxFileName$3 = "/Users/nohuhu/dev/statium/src/withBindings.js";
const withBindings = boundProps => Component => {
    const bindings = normalizeBindings(boundProps);
    
    // Bound props come *last*, which bears the possibility of clobbering similar named
    // props passed to component from elsewhere. This tradeoff, however, is much better
    // from debugging standpoint than the other way around.
    const ComponentWithBindings = componentProps => (
        React.createElement(ViewModelContext.Consumer, {__self: null, __source: {fileName: _jsxFileName$3, lineNumber: 13}}
            ,  ({ vm }) => React.createElement(Component, { ...componentProps, ...mapProps(vm, bindings), __self: null, __source: {fileName: _jsxFileName$3, lineNumber: 14}} ) 
        )
    );
    
    return ComponentWithBindings;
};

const useBindings = (..._bindings) => {
    const { vm } = useContext(ViewModelContext);
    
    return multiGet(vm, _bindings);
};

const useController = () => {
    const vc = useContext(ViewControllerContext);
    
    return expose(vc);
};

export default ViewModel;
export { Bind, ViewController, useBindings, useController, withBindings };
