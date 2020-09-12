export const accessorType: unique symbol;
export function multiGet(vm: any, keys: any): any;
export function multiSet({ vm, forceKey, single }: {
    vm: any;
    forceKey: any;
    single: any;
}, key: any, value: any): any;
export function accessorizeViewModel(vm: any): any;
export function validateInitialState(state: any, vm: any): boolean;
