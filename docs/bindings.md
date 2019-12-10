# Binding overview

The purpose of the data binding mechanism is to give consumer Components access
to the data in `ViewModel` store. In order to gain that access, Components define
the store keys they want to access, prop names the values are going to be assigned to,
and various access options. A binding defines what a Component _wants_ to receive, and
it is entirely possible to give different Components access to the same `ViewModel`
store key in different ways customized for each Component.

It is important to note that fetching the bound value from the store happens
synchronously at the consuming Component's rendering time. On the other hand, updating
store key with a new value happens asynchronously.

## Binding syntax

There are several forms of binding syntax supported by Statium, allowing to optimize
application code for better readability in most cases, or better configurability in
other cases, while trying hard to be predictable, convenient, and generally follow
the principle of least astonishment. In most cases what you see is what you get,
however there are a few exceptions noted below.

### Object vs Array results

Statium allows binding to store keys either indirectly by injecting resolved values
into consuming Component's props (using `withBindings` HOC) or child function arguments
(using `Bind` component), or by a direct _function call_, e.g. via `useBindings` hook
or a `ViewController` getter.

In the former case, there is little choice as to what form the result can take. Component
props are always an object, and passing multiple values to a function is better done
via an object too. Consequently, both `withBindings` HOC and `Bind` component will accept
any binding syntax form but will always return an object with key/value pairs corresponding
to the binding definition.

In the latter case, there is a choice between returning an object with key/value pairs,
or an array with values. Both options are equally valid and can be convenient in different
ways, so both options are supported.

The default is to return an array of values in the same order as binding definitions:

    const Component = () => {
        const [foo, bar] = useBindings('foo', 'bar'); // Note variadic arguments
        ...
    };

If you find that an object with key/value pairs is more convenient, use the object
binding syntax:

    const Component = () => {
        const { foo, bar } = useBindings({
            // This is a slightly more verbose form of the same binding:
            // fetch the value for ViewModel store key 'foo', put it in
            // a property named 'foo', etc.
            foo: 'foo',
            bar: 'bar',
        });
    };

### Simplified syntax

A single string; means that consumer Component is bound to a single key in `ViewModel`
store, with the string value being the name of the key to bind to, as well as the name
of the prop to inject into consumer component. The binding is assumed to be one-way
(read only), with value from ViewModel store being injected into consumer Component's
props without ability for the component to change the value.

For `useBindings` and `ViewController` getters, returns the value itself instead of
containing it in an array or an object.

Example (`withBindings` HOC):

    const Component = ({ blerg }) => ();

    // Bind Component to the key 'blerg' in ViewModel store, and inject the property
    // with the same name in Component props at rendering.
    const BoundComponent = withBindings('blerg')(Component);

Example (`useBindings` hook):

    const Component = () => {
        // Fetch the value for ViewModel key 'throbbe', and return it immediately.
        const throbbe = useBindings('throbbe');
        ...
    };

### Array and variadic syntax

If more than one binding is desired, an array or variadic arguments can be used.
In this case definitions are iterated over and resolved individually. Each element
of the array can be a string (see Simplified syntax above), a two-element array,
or an object with binding options (see Binding options below).

The two-element array syntax is a shortcut to request both value and the setter
function for that value, returned also in an array of two elements.

Example (`withBindings` HOC):

    const BoundComponent = withBindings([
         'foo', // Bind to 'foo' key in ViewModel store, inject 'foo' prop, one way
         ['bar', true] // Bind to 'bar' key and inject setter function as 'setBar' prop
         { ... } // See below
     ])(Component);

Example: (`useBindings` hook):

    const Component = () => {
        // Same as above, but returning an array by default
        const [foo, [bar, setBar]] = useBindings('foo', ['bar', true]);
        ...
    };

### Object syntax

To pass various options, an object syntax can be used. In this case the keys of the object
are interpreted as prop name to be injected into consumer component, and the value
of the definition object can be either:

1. A string, in which case it is assumed to be the name of the ViewModel store key
to bind to, in one-way mode,
2. A function, which is assumed to be an inline formula,
2. An object with binding options, see Binding options below.

Example (`withBindings` HOC):

    const BoundComponent = withBindings({
         foo: 'bar',  // Bind consumer component to key 'bar' in ViewModel store,
                      // inject the value as prop named 'foo', one way
         qux: 'fred', // Bind to key 'fred', inject as prop 'qux', one way
         plugh: {
             ...      // See Binding options below
         }
    })

### Binding options

Binding options provided via an object allow expanded configuration of a binding.
The following options are supported:

- `key`: the name of the key in ViewModel store. Key name is the only mandatory option
that should be provided. 
- `prop`: the name of the prop to inject into consumer component's props at render time,
with value retrieved from ViewModel store. If `prop` is omitted, it is assumed to be
equal to `key` option.
- `formula`: A function that is used to compute the bound value. See [Formulas](docs/formulas.md).
- `publish`: The only recognized value is a Boolean `true`. This means to bind
two way (read-write), and consumer component will receive a setter function in its props
along with the value, similar to React `useState` hook: `[foo, setFoo] = useState(0)`.
See [Object vs Array results](#Object_vs_Array_results) for more detail on prop injection.
- `setterName`: The name of the prop used to pass the setter function into consumer
component props. If not provided, a default setter prop name of `setFoo` is used,
where `Foo` is a capitalized name of the key the setter is for. This is sometimes useful
for form fields, where the input value might be desired to be passed
in the `value` prop, but the setter should be named `onChange` or similar.

The setter function needs to be called with a single argument, which is the new value
for the ViewModel store key.

Example:

     {
         // Bind go key `blerg` in ViewModel store
         key: 'blerg',

         // Inject the value in prop named `ghek` into consumer component
         prop: 'ghek',

         // Bind two-way, request a setter function for `blerg` key
         publish: true,
         
         // Consumer component will receive setter function in `onChange` prop
         setterName: 'onChange', 
     }
