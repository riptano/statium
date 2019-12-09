import React, { useContext } from 'react';
import loGet from 'lodash.get';
import loSet from 'lodash.set';
import loHas from 'lodash.has';
import loClone from 'lodash.clone';
import upperFirst from 'lodash.upperfirst';
import defer from 'lodash.defer';

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

const ViewModelContext = React.createContext({ vm: rootViewModel });
const ViewControllerContext = React.createContext(rootViewController);

let idCounter = 0;

const getId = prefix => `${prefix}-${++idCounter}`;

const chain = (proto, props) => Object.assign(Object.create(proto), props);

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

/**
 *
 * Convenience function that accepts ViewModel binding definition in various formats,
 * including expanded format for more settings, as well as some shortcut forms, does
 * certain correctness checks, and reduces binding definitions to normalized form
 * that is then used in `mapProps` at value retrieval time.
 *
 * Normalization is done once at consumer component rendering time as opposed to
 * value retrieval time for the following reasons:
 *
 * * It allows simplifying the code that works with binding definitions (`mapProps`),
 * because there is no need for it to check for all possible binding options that might be
 * supported by ViewModel now or in the future.
 *
 * * It allows keeping the code that does correctness checks in one place, which helps
 * with readability and maintainability.
 *
 * * It allows doing correctness checks at the component rendering time, or at component
 * constructor definition time (when used via `withBindings` HOC), as opposed to every time
 * a key/value pair is retrieved from ViewModel store.
 *
 * * It provides for better developer experience by giving an option to define bindings
 * in shortcut forms instead of having to spell out a normalized form each time. This
 * improves code readability.
 *
 * * It is a form of preemptive performance optimization where the cost of correctness
 * checks and supporting various shortcut forms for binding definitions is not incurred
 * each time a key/value pair is retrieved for a consumer component, but instead is incurred
 * only once.
 *
 * @params {Object|Array|String} bindings The binding definitions to normalize. The following
 * forms are supported:
 *
 * - A single string; means that consumer component is bound to a single key in ViewModel store,
 * with the string value being the name of the key to bind to, as well as the name of the
 * prop to inject into consumer component. The binding is assumed to be one-way (read only),
 * with value from ViewModel store being injected into consumer component's props without
 * ability for the component to change the value.
 *
 * Example: `normalizeBindings('foo')` -> bind a component one way to a key named 'foo' in the
 * ViewModel store, and inject the prop named 'foo' with the value from the ViewModel store
 * into consumer component's props at rendering time.
 *
 * - An array of binding definitions. In this case definitions are iterated over
 * and normalized individually. Each element of the array can be a string (see above),
 * or an object with binding options (see Binding options below).
 *
 * Example:
 *
 *      normalizeBindings([
 *          'foo', // Bind to 'foo' key in ViewModel store, inject 'foo' prop, one way
 *          'bar', // -- '' --
 *          { ... } // See below
 *      ])
 * 
 * - An object of binding definitions. In this case the keys of the object are interpreted
 * as *prop* name to be injected into consumer component, and the value of the definition
 * object can be either:
 *
 * 1. A string, in which case it is assumed to be the name of the ViewModel store key
 * to bind to, in one-way mode
 * 2. An object with binding options, see Binding options below.
 *
 * Example:
 *
 *      normalizeBindings({
 *          foo: 'bar',  // Bind consumer component to key 'bar' in ViewModel store,
 *                       // inject the value as prop named 'foo', one way
 *          qux: 'fred', // Bind to key 'fred', inject as prop 'qux', one way
 *          plugh: {
 *              ...      // See Binding options below
 *          }
 *      })
 *
 * Binding options provided via an object allow expanded configuration of a binding.
 * The following options are supported:
 *
 * - `key`: the name of the key in ViewModel store. Key name is the only mandatory option
 * that should be provided. 
 * - `prop`: the name of the prop to inject into consumer component's props at render time,
 * with value retrieved from ViewModel store. If `prop` is omitted, it is assumed to be
 * equal to `key` option.
 * - `publish`: Can be either a Boolean `true`, or a String. In both cases this means to bind
 * two way (read-write), and consumer component will receive a setter function in its props
 * along with the value, similar to React `useState` hook: `[foo, setFoo] = useState(0)`.
 * 
 * When `publish` value is a string, it is interpreted as the key name to update when
 * setter function is called. When `publish` value is a Boolean, it is interpreted as a
 * shortcut to indicate two-way binding, and published key name is assumed to be the same
 * as bound key name (`key` above). The `publish` value of `false` is legal but is
 * meaningless and is not recommended as its meaning is the same as the default
 * (one-way binding).
 *
 * - `setterName`: The name of the prop used to pass the setter function into consumer
 * component props. If not provided, a default setter prop name of `setFoo` is used,
 * where `Foo` is a capitalized name of the published prop (see `publish`). This is
 * sometimes useful for form fields, where the input value might be desired to be passed
 * in the `value` prop, but the setter should be named `onChange` or similar.
 *
 * The setter function needs to be called with a single argument, which is the new value
 * for the ViewModel store key.
 *
 * Example:
 *
 *      {
 *          // Bind go key `blerg` in ViewModel store
 *          key: 'blerg',
 *
 *          // Inject the value in prop named `ghek` into consumer component
 *          prop: 'ghek',
 *
 *          // Bind two-way, equivalent to `publish: 'blerg'`
 *          publish: true,
 *          
 *          // Consumer component will receive setter function in `onChange` prop
 *          setterName: 'onChange', 
 *      }
 *
 *
 * @return {Object[]} Array of normalized bindings in the form of:
 *
 *      [{
 *          key: 'The ViewModel store key to bind to',
 *          propName: 'The prop name to inject',
 *          publish: 'The key name to publish',
 *          setterName: 'Setter function prop name',
 *      }, {
 *          ...
 *      }]
 *
 * Note that this is a *private* function that is not intended to be used outside of
 * this module, and is not a part of the public ViewModel API. It is exported from this
 * module solely for the purpose of unit testing. Private function API is not guaranteed
 * to be stable and might change at any time without notice. This documentation blob
 * covers only input and output of this private function, with brief explanations of
 * ViewModel features, but does not strive to cover public ViewModel API in full.
 *
 * @private
 */
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
        
        owner.$dispatch(event, value);
    }
    else {
        owner.setState({ [key]: value });
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

const multiSet = (vm, key, value) => {
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
            };
            
            ownerMap.set(owner, o);
        }
        
        o.values[k] = kv[k];
    }
    
    if (process.env.NODE_ENV !== 'production') {
        if (ownerMap.size > 1) {
            const offendingKeys = [...ownerMap.values()].map(({ owner, values }) => {
                const keys = getKeys(values).map(k => `"${String(k)}"`);
            
                if (!keys.length) {
                    return '';
                }
                else if (keys.length === 1) {
                    return `key ${keys[0]} is defined in ViewModel with id: "${owner.id}"`;
                }
                else {
                    return `keys ${keys.join(', ')} are defined in ViewModel with id: "${owner.id}"`;
                }
            });
            
            console.warn(
                `Setting multiple key/value pairs belonging to different ViewModels ` +
                `simultaneously can lead to performance issues because of extra rendering ` +
                `involved. Offending key/value pairs: ${offendingKeys.join('; ')}.`
            );
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
    
    for (const item of sortedQueue) {
        const { owner, values } = item;
        
        owner.setState(values);
    }
};

const accessorizeViewModel = vm => {
    vm.$retrieve = key => retrieve(vm, key);
    vm.$retrieve.$accessorType = 'retrieve';
    
    vm.$get = key => getter(vm, key);
    vm.$get.$accessorType = 'get';
    
    vm.$set = (...args) => setter(vm, ...args);
    vm.$set.$accessorType = 'set';
    
    vm.$dispatch = vm.$dispatch || vm.parent.$dispatch;
    
    return vm;
};

const validateInitialState = state => {
    if (state && typeof state === 'object' && !Array.isArray(state)) {
        return true;
    }
    
    throw new Error(`Invalid initialState: ${JSON.stringify(state)}`);
};

const _jsxFileName = "/Users/nohuhu/dev/statium/src/ViewController.js";
const expose = ({ $get, $set, $dispatch }) => ({
    $get,
    $set,
    $dispatch,
});

const dispatcher = (vc, event, payload) => {
    const [owner] = findOwner(vc, 'handlers', event);
    const handler = owner && owner.handlers[event];
    
    if (typeof handler === 'function') {
        vc.defer(handler, vc, true, ...payload);
    }
    else {
        rootViewController.$dispatch(event, ...payload);
    }
};

const accessorizeViewController = (vm, vc) => {
    vc.$get = (...args) => multiGet(vm, args);
    vc.$get.$accessorType = 'get';
    
    vc.$set = (...args) => multiSet(vm, ...args);
    vc.$set.$accessorType = 'set';
    
    vc.$dispatch = (event, ...payload) => dispatcher(vc, event, payload);
    vc.$dispatch.$accessorType = 'dispatch';
    
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
    
    defer(fn, vc, cancel = false, ...args) {
        let timer = this.timerMap.get(fn);
        
        if (timer) {
            if (cancel) {
                clearTimeout(timer);
                this.timerMap.delete(fn);
            }
            else {
                console.warn('Double executing handler function: ', fn.toString());
            }
        }
        
        timer = defer(() => {
            fn(expose(vc), ...args);
        });
        
        this.timerMap.set(fn, timer);
    }
    
    runRenderHandlers(vc, props) {
        const me = this;
        
        const { initialize, invalidate } = props;
        
        if (!me.$initialized) {
            if (typeof initialize === 'function') {
                // We have to defer executing the function because setting state
                // is prohibited during rendering cycle.
                me.defer((...args) => {
                    initialize(...args);
                    me.$initialized = true;
                }, vc);
            }
            else {
                me.$initialized = true;
            }
        }
        else {
            // Same as `initialize`, we need to run `invalidate`
            // out of event loop.
            if (typeof invalidate === 'function') {
                me.defer(invalidate, vc, true); // Cancel previous invocation
            }
        }
    }
    
    render() {
        const me = this;
        
        const { id, $viewModel, handlers, children } = me.props;
        
        const innerVC = ({ vm }) => 
            React.createElement(ViewControllerContext.Consumer, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 114}}
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
                        React.createElement(ViewControllerContext.Provider, { value: vc, __self: this, __source: {fileName: _jsxFileName, lineNumber: 138}}
                            ,  children 
                        )
                    );
                }
            );
    
        return $viewModel
            ? innerVC({ vm: $viewModel })
            : React.createElement(ViewModelContext.Consumer, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 147}}
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
        
        return applyState ? applyState(localState, vm.$get) : null;
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
            initialState = initialState(vm.$retrieve);
        }
        
        if (process.env.NODE_ENV !== 'production') {
            validateInitialState(initialState);
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
        setter.$accessorType = 'set';
        
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
        
        const store = { ...vm.data, ...me.state };
        vm.store = chain(vm.parent.store, store);
        
        vm.protectedKeys = me.protectedKeys;
        vm.getKeySetter = me.getKeySetter;
        vm.setState = me.setViewModelState;
        
        const innerViewModel = (
            React.createElement(ViewModelContext.Provider, { value: { vm }, __self: this, __source: {fileName: _jsxFileName$1, lineNumber: 126}}
                ,  children 
            )
        );
        
        const controller = me.props.controller || (me.protectedKeys ? {} : null);
        
        return !controller
            ? innerViewModel
            : React.createElement(ViewController, { ...controller, $viewModel: vm, ownerId: vm.id, __self: this, __source: {fileName: _jsxFileName$1, lineNumber: 135}}
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
    React.createElement(ViewModelContext.Consumer, {__self: null, __source: {fileName: _jsxFileName$1, lineNumber: 147}}
        ,  ({ vm: parent }) => {
            const formulas = chain(parent.formulas, props.formulas);
            const data = chain(parent.data, props.data);
            const state = chain(parent.state, {});
            
            const vm = accessorizeViewModel({
                id: 'id' in props ? props.id : getId('ViewModel'),
                parent,
                formulas,
                data,
                state,
                // This property gets overwritten by ViewModelState.render(); the purpose
                // of having it here is to provide initial empty state object for
                // applyState()
                store: { ...data, ...state },
            });
            
            return (
                React.createElement(ViewModelState, { vm: vm,
                    controller: props.controller,
                    initialState: props.initialState,
                    applyState: props.applyState,
                    observeStateChange: props.observeStateChange,
                    protectedKeys: props.protectedKeys, __self: null, __source: {fileName: _jsxFileName$1, lineNumber: 166}}
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
    
    return { $get: vc.$get, $set: vc.$set, $dispatch: vc.$dispatch };
};

export default ViewModel;
export { Bind, ViewController, useBindings, useController, withBindings };
