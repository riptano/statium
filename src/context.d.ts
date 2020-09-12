export class ViewModelUnmountedError extends Error {
    constructor(...args: any[]);
    isViewModelUnmounted: boolean;
}
export namespace rootViewModel {
    export const formulas: {};
    export const data: {};
    export const state: {};
    export const store: {};
    export { defaultGet as $get };
    export { defaultSet as $set };
    export function $resolveValue(key: any): void;
    export { defaultDispatch as $dispatch };
}
export namespace rootViewController {
    export { rootViewModel as vm };
    export const $get: any;
    import $set = rootViewModel.$set;
    export { $set };
    export { defaultDispatch as $dispatch };
}
export const Context: any;
declare function defaultGet(key: any): void;
declare function defaultSet(key: any, value: any): void;
declare function defaultDispatch(event: any, ...payload: any[]): void;
export {};
