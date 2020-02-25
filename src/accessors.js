import loGet from 'lodash.get';

import { validKey, getKeys, getKeyPrefix, findOwner } from './util';
import { normalizeBindings, mapProps, mapPropsToArray } from './bindings';

export const accessorType = Symbol('accessorType');

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

export const multiGet = (vm, keys) => {
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

export const multiSet = (vm, key, value) => {
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

export const accessorizeViewModel = vm => {
    vm.$retrieve = key => retrieve(vm, key);
    vm.$retrieve[accessorType] = 'retrieve';
    
    vm.$get = key => getter(vm, key);
    vm.$get[accessorType] = 'get';
    
    vm.$multiGet = (...args) => multiGet(vm, args);
    vm.$multiGet[accessorType] = 'get';
    
    vm.$set = (...args) => setter(vm, ...args);
    vm.$set[accessorType] = 'set';
    
    vm.$dispatch = vm.$dispatch || vm.parent.$dispatch;
    
    return vm;
};

export const validateInitialState = (state, vm) => {
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
