export function normalizeBindings(bindings: {}, variadic: any): ({
    propName: any;
    key: any;
    formula: any;
} | {
    formula?: any;
    setterName?: any;
    propName: any;
    key: any;
    publish: any;
})[];
export function mapProps(vm: any, bindings: any): any;
export function mapPropsToArray(vm: any, bindings: any): any;
