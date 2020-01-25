import React from 'react';

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

export const rootViewModel = {
    formulas: {},
    data: {},
    state: {},
    store: {},
    $get: defaultGet,
    $set: defaultSet,
    $retrieve: key => rootViewModel.$get(key),
    $dispatch: defaultDispatch,
};

export const rootViewController = {
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
export const ViewModelContext = (() => {
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

export const ViewControllerContext = (() => {
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
