import upperFirst from 'lodash.upperfirst';

let idCounter = 0;

export const getId = prefix => `${prefix}-${++idCounter}`;

export const chain = (proto, ...sources) => Object.assign(Object.create(proto), ...sources);

export const setterNameForKey = key => `set${upperFirst(key)}`;

export const getKeys = object =>
    [].concat(Object.getOwnPropertySymbols(object), Object.getOwnPropertyNames(object));
    
export const getKeyPrefix = key =>
    typeof key === 'symbol' ? key : String(key).split('.').shift();

export const validKey = key =>
    (typeof key === 'string' && key !== '') || typeof key === 'symbol';

export const findOwner = (object, entityName, key) => {
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

export const normalizeProtectedKeys = keys => {
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
