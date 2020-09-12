export function useController(): {
    $get: (...args: any[]) => any;
    $set: (...args: any[]) => any;
    $dispatch: (...args: any[]) => any;
};
