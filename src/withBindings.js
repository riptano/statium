import React from 'react';

import { ViewModelContext } from './context';
import { normalizeBindings, mapProps } from './bindings';

export const withBindings = (...boundProps) => Component => {
    const bindings = normalizeBindings(boundProps);
    
    // Bound props come *last*, which bears the possibility of clobbering similar named
    // props passed to component from elsewhere. This tradeoff, however, is much better
    // from debugging standpoint than the other way around.
    const ComponentWithBindings = componentProps => (
        <ViewModelContext.Consumer>
            { ({ vm }) => <Component {...componentProps} {...mapProps(vm, bindings)} /> }
        </ViewModelContext.Consumer>
    );
    
    return ComponentWithBindings;
};
