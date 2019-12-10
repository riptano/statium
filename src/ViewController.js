import React from 'react';
import defer from 'lodash.defer';

import { ViewModelContext, ViewControllerContext, rootViewController } from './context';
import { multiGet, multiSet, accessorType } from './accessors';
import { getId, findOwner } from './util';

export const expose = ({ $get, $set, $dispatch }) => ({
    $get,
    $set,
    $dispatch,
});

export const dispatcher = (vc, event, payload) => {
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
    vc.$get[accessorType] = 'get';
    
    vc.$set = (...args) => multiSet(vm, ...args);
    vc.$set[accessorType] = 'set';
    
    vc.$dispatch = (event, ...payload) => dispatcher(vc, event, payload);
    vc.$dispatch[accessorType] = 'dispatch';
    
    return vc;
};

export class ViewController extends React.Component {
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
            <ViewControllerContext.Consumer>
                { parent => {
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
                        <ViewControllerContext.Provider value={vc}>
                            { children }
                        </ViewControllerContext.Provider>
                    );
                }}
            </ViewControllerContext.Consumer>;
    
        return $viewModel
            ? innerVC({ vm: $viewModel })
            : <ViewModelContext.Consumer>
                { innerVC }
              </ViewModelContext.Consumer>;
    }
}
