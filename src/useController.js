import { useContext } from 'react';

import { ViewControllerContext } from './context.js';
import { expose } from './ViewController.js';

export const useController = () => {
    const vc = useContext(ViewControllerContext);
    
    return expose(vc);
};
