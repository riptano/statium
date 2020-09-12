export function exceptionificate(fn: any, vm: any): (...args: any[]) => any;
export function expose({ vm, $get, $set, $dispatch }: {
    vm: any;
    $get: any;
    $set: any;
    $dispatch: any;
}): {
    $get: (...args: any[]) => any;
    $set: (...args: any[]) => any;
    $dispatch: (...args: any[]) => any;
};
export function invalidSet(): never;
export function invalidDispatch(): never;
export class ViewController {
    constructor(props: any);
    id: any;
    timerMap: Map<any, any>;
    defer(fn: any, vc: any, wantPromise: any, ...args: any[]): Promise<any>;
    runRenderHandlers(vc: any, props: any): void;
    state: {
        error: any;
    };
    componentWillUnmount(): void;
    execute(fn: any, vc: any, args: any, resolve: any, reject: any): Promise<any>;
    render(): any;
}
