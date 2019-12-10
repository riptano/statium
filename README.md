# Statium

Pragmatic state management for React applications

## Synopsis

```javascript
import React from 'react';
import ViewModel, { Bind } from 'statium';
import { Form, InputField, validate } from 'some-form-ui';

const PasswordForm = () => (
    <ViewModel
        initialState={{ password1: '', password2: '', errors: [] }}
        applyState={
            state => ({
                ...state,
                errors: validate(state),
            })
        }>
        
        <Bind props={[ ['password1', true], ['password2', true], errors ]}>
            { ({ password, setPassword1, password2, setPassword2, errors }) => (
                <Form>
                    <InputField label="Enter password"
                        value={password1}
                        onChange={setPassword1} />
            
                    <InputField label="Confirm password"
                        value={password2}
                        onChange={setPassword2} />
            
                    { errors.length > 0 && errors.map(error => <div>{error}</div>) }
                </Form>
            )}
        </Bind>
    </ViewModel>
);
```

## Introduction

The idea behind Statium is to keep simple things simple and make hard things manageable.

Component state is contained in a `ViewModel`, which is a React Component implementing a
hierarchically scoped key/value store with a few additional features. Consumer Components
make use of the values by _binding_ to keys they need, and receive the values along with
setter functions for these values, if requested. Calling the setter function with a value
will update the store and re-render the owner `ViewModel` and its children components.

All `ViewModels` are connected in a chain from parent to child, and each child `ViewModel`
has access to its ancestors' store values throughout the tree. When a setter function
is called for a given state key, it will climb the `ViewModel` tree, find the store owner
that the key belongs to, and update the state in that owner. Thus, the state changes are
always contained to the least possible component subtree, and only the affected subtree
is rendered upon the change.

Besides the `ViewModel`, Statium provides the `ViewController` component that helps in
controlling asynchronous application logic flow. A `ViewController` is always bound to
its parent `ViewModel`, i.e. it can read its (and its parents) store, and can set
the state values. It can also listen to _events_ dispatched by consumer Components,
and invoke _handlers_ that implement custom logic beyond the simple value assignment.

## Data binding

A store of values is not very useful by itself, unless it can be accessed in an easy
and predictable manner. In Statium, this is done by _binding_, or subscribing to,
`ViewModel` keys. This can be done in three similar ways, differing only in minor
details:

* By calling [`useBindings`](docs/useBindings.md) hook in your functional component;
* By using [`withBindings`](docs/withBindings.md) Higher Order Component to inject
the requested values and setters into Component props;
* Or by using the [`Bind`](docs/Bind.md) Component that accepts a function as a child,
and passes the requested values and setters into that function's arguments.

Bindings are defined as mapping of _keys_ from the `ViewModel` store to _props_
injected into Component's props (or `Bind` child function arguments), e.g.:

    import { withBindings } from 'statium';

    const Component = ({ foo, onChangeFoo, bar }) => (
        { /*
            Do something to render foo and bar values;
            call onChangeFoo(newFoo) whenever foo needs to be updated
        /* }
    );

    const BoundComponent = withBindings({
        // Map `value` component prop to `foo` key in ViewModel store, and request
        // a setter function for it (named `setFoo` by default but we rename it here).
        // Both `value` and `onChangeFoo` are injected into Component props at rendering.
        value: {
            key: 'foo',
            publish: true,
            setterName: 'onChangeFoo',
        },
        bar: 'barKey',
    })(MyComponent);

`useBindings` hook works similarly but the calling convention is a little different
by default, to accommodate for React Hooks stylistic:

    import { useBindings } from 'statium';

    const Component = () => {
        // Binding definition ['bar', true] is a shortcut for { key: 'bar', publish: true }.
        // The [value, setterFn] tuple is returned in an array, a la `useState` React hook.
        const [foo, [bar, setBar]] = useBindings('foo, ['bar', true]);
    
        ...
    };

It is also possible to call [`useBindings`](docs/useBindings.md) with binding definitions
in an object, the same way as [`withBindings`](docs/withBindings.md), and
[`Bind`](docs/Bind.md) component. The result is going to be also an object. More about
binding syntax can be found [here](docs/bindings.md).

## ViewModel in depth

Storing component state is the primary task for a `ViewModel`, but not the only one.
Let's review some use cases common to UI development that `ViewModel` accommodates for:

### Static data

In many cases, there is a need to give individual Components access to certain pieces
of data available in some places up the tree. A feature flag option from external
service, or `history` and `match` props if you are using `react-router`, or simply
a constant defined somewhere that you need to spread to child components. `ViewModel`
makes this easy by passing an object with key/value pairs in the `data` prop:

    const Container = ({ foo, bar }) => (
        <ViewModel data={{ foo, bar }}>
            ... // `foo` and `bar` values are now available for binding downstream
        </ViewModel>
    );

In fact, the `ViewModel` _store_ that we discussed above consists of both _data_
and _state_ parts, combined thusly:

    const store = { ...data, ...state };

It is possible to have some `ViewModels` in the hierarchy to provide only data,
and some only state, and some a combination of both. The static data is considered
read-only, and trying to request a setter function for a `data` key will throw
an exception.

### Computed values

Another very common use case is when a value is the result of some computation, e.g.
checking form validity after a value change, extracting a specific property out of
an object contained in the state, or combining strings to produce a user greeting.
This can be easily solved by using `ViewModel` _formulas_:

    const Component = () => (
        <ViewModel initialState={{ first: 'Foo', last: 'Barootsky' }}
            formulas={{
                fullName: $get => $get('first') + ' ' + $get('last'),
            }}>
        
            <Bind props="fullName">
                { ({ fullName }) => (
                    <div>Hello, {fullName}!</div>
                )}
            </Bind>
        </ViewModel>
    );

A formula is simply a function that receives _getter_ function as its first and only
argument. Calling the getter with the desired key names will return the values -
which can invoke other formulas! - and the formula should itself return the computed value.

Another way to compute values is to use _inline formulas_ defined in bindings, which
allows using local variables or do things specific to some Component:

    const baz = 42;

    const Component = ({ foo }) => (
        ...
    );

    const BoundComponent = withBindings({
        foo: $get => $get('bar') + baz;
    })(Component);

See more in [Formulas](docs/formulas.md).

### Working with ViewModel state

Often times the component state should come from an external source, like application
URL `search` portion. In such cases it is also desirable to persist the state changes
back to the URL. `ViewModel` accommodates for it by accepting a function as `initialState`
prop, as well as providing the `observeStateChange` lifecycle method that is called
upon any change to the state of owner `ViewModel`.

Example:

    import ViewModel, { Bind} from 'statium';
    import stateToUri from 'urlito';
    import Table from 'some-ui-framework';
    
    // Defaults are assumed if URL param is missing
    const defaultState = {
        sort: 'asc',
    };
    
    const [getStateFromUri, setStateToUri] = stateToUri(defaultState);
    
    const SortedTable = () => (
        <ViewModel initialState={getStateFromUri} observeStateChange={setStateToUri}>
            <Bind props={[{ key: 'sort', publish: true }]}>
                { ({ sort, setSort }) => (
                    <Table sortOrder={sort} onSortOrderChange={setSort}>
                        ...
                    </Table>
                )}
            </Bind>
        </ViewModel>
    );

When provided as a function, `initialState` will be called at `ViewModel` construction
time, and is expected to _synchronously_ return a valid object with default state. 
If asynchronous initialization is desired, a `ViewController` can be used with `initialize`
prop; keep in mind that `initialState` is still required for feeding child components
the initial state until asynchronous request completes.

The purpose of `observeStateChange` is to allow side effects like setting the URL in the
example above. This function, if provided, is called synchronously upon `ViewModel` state
change, and is not expected to return any value.

### Modifying ViewModel state

What if we needed to apply some logic to `ViewModel` state updates? Something simple like
this: if `foo` changes, then `bar` needs to be set to `null`, or: run validation function
on every change, etc.

The `applyState` function allows doing exactly this:

    const validator = state => {
        const { password1, password2 } = state;
        
        if (password1 !== password2) {
            return {
                ...state,
                errors: ['Passwords are not matching!'],
            };
        }
    };
    
    const Component = () => (
        <ViewModel initialState={{ password1: '', password2: '' }}, applyState={validator}>
            <Bind props={[
                { key: 'password1', publish: true },
                { key: 'password2', publish: true },
                'errors',
            ]}>
                { ({ password1, setPassword1, password2, setPassword2 }) => (
                    <Form>
                        <PasswordInput label="Enter password"
                            value={password1}
                            onChange={setPassword1} />
                        
                        <PasswordInput label="Confirm password"
                            value={password2}
                            onChange={setPassword2} />
                        
                        { errors.map(error => <div>{error}</div>) }
                    </Form>
                )}
            </Bind>
        </ViewModel>
    );

See more in [ViewModel documentation](docs/ViewModel.md).

### Protected keys

This use case is not as common as the others discussed above, but is encountered in almost
every application. Consider a key/value pair where the key should be readable by any
consumer Component, but _not_ easily writable without going through some validation
or implementation logic.

One example is a `user` object in applications requiring authentication: details of the user
(name, user id, email, etc) should be accessible throughout the codebase; setting the
actual object should be only done via some code that requests authentication from the
server side (logs in).

In Statium, this can be achieved easily using protected keys feature. _Protected_ in this
context means that any Consumer can bind to the specified key, but calling the corresponding
setter function _does not_ set the value directly. Instead, a `ViewController` event
is dispatched, and the corresponding event handler is called. It is up to the event handler
implementation to decide what to do, and whether to change or not the actual value
for the protected key.

Example:

    import ViewModel, { Bind } from 'statium';
    import doLogin from 'some-auth-library';
    
    import LoadingScreen from './LoadingScreen';
    import LoginForm from './LoginForm';
    import AfterLogin from './AfterLogin';
    
    const login = async ({ $set }, info) => {
        const { username, password } = info;
        
        // Setters return a Promise that is resolved when
        // ViewModel state has finished updating.
        await $set({ loading: true });
        
        // Try to authenticate in some way
        const authenticatedUser = await doLogin(username, password);
        
        if (authenticatedUser) {
            $set({
                loading: false,
                user: authenticatedUser,
            });
        }
    };
    
    const Application = () => (
        <ViewModel initialState={{ user: null, loading: false }}
            protectedKeys="user"
            controller={{
                handlers: {
                    setUser: login,
                },
            }}>
            <Bind props={['loading', ["user", true]]}>
                { ({ loading, user, setUser }) => {
                    if (user) {
                        return <AfterLogin user={user} />
                    }
                    else if (loading) {
                        return <LoadingScreen />
                    }
                    else {
                        return (
                            <LoginForm onClick={
                                ({ username, password }) => setUser({ username, password })
                            } />
                        );
                    }
                }}
            </Bind>
        </ViewModel>
    );

See more in [ViewModel documentation](docs/ViewModel.md) and
[ViewController documentation](docs/ViewController.md).

## ViewController

Using `ViewModel` might be sufficient for the majority of use cases in an application,
but some pieces of business logic are too complex to fit into "read this", "set that"
narrative. For these advanced use cases, `ViewController` offers a way to express the
business logic that is both easy to read and is easy to test.

Consider the login example above: `setUser` is an `async` function. It receives arguments,
makes a call to the server to attempt authentication, waits for the results to come back,
and then if the server call is successful, it finally sets the `user` value to that of
the authenticated user. It is simple, straightforward, and is easy to read -- but only
if we discount the `async` nature of the function.

Consider also that in the login example, we are handling complex state transitions
with loading indication. Here we have only two state keys to think of, and already
this logic would be non-trivial to implement in vanilla React. If we add another step
or two, like "read that key and load more data if it is incomplete", the code becomes
way too complex to fit into one simple function.

Not so in a `ViewController` handler, it is still easy to read:

    const loadSomething = async ({ $get, $set }) => {
        const [data] = $get('data');
        
        if (isSomethingMissing(data)) {
            await $set({ loading: true });
            const missingPiece = await loadSomeMore(data);
            
            const result = await transformPieces(data, missingPiece);
            
            $set({
                loading: false,
                data: result,
            });
        }
    };

This way it is also easy to progressively load your data:

    const loadUserPosts = async ({ $get, $set }) => {
        let [user, posts, comments] = $get('user', 'posts', 'comments');
        
        if (!posts) {
            await $set({ loading: true });
            
            posts = await loadPosts(user);
            
            await $set({ loading: false, posts });
        }
        
        if (!comments) {
            await $set({ loading: true });
            
            comments = await loadComments(user, posts);
            
            await $set({ loading: false, comments });
        }
    };

### ViewController events

Events are a way to invoke particular pieces of logic within a `ViewController`. Events
are _dispatched_ by consumer Components or `ViewModels`, and _handled_ by `ViewControllers`.
`ViewControllers` are chained parent to child like `ViewModels`, and are automatically
bound to the nearest parent `ViewModel`, meaning that `ViewController` can read all
store keys for the `ViewModel` it is bound to, and all its parent `ViewModels`.

Similar to the `ViewModel` store keys, when an event is dispatched, the `ViewController`
will climb up the parent chain and try to find the first handler for the given event name.
When a handler is found, it is called with the arguments provided to `$dispatch` call,
and climbing stops. No return value is expected. If no handler is found, an exception
will be thrown.

Event handler invocation is always deferred to the next event loop. If the same event
was dispatched multiple times in the same event loop, the last invocation wins and
previous ones are canceled.

### ViewController lifecycle functions

In addition to handling events, a `ViewController` can be used to manipulate `ViewModel`
state via two lifecycle functions: `initialize` and `invalidate`. 

`initialize` is called at the first rendering of the `ViewController` component, and can be
used to perform extended initialization of the linked `ViewModel`, such as loading data
from external source. Results of such action are asynchronous and not guaranteed, and so
the best approach is to define the `ViewModel` with `initialState` that contains some
reasonable defaults allowing partial rendering of the child components, while doing
the loading and validating part in the `initialize` function of a `ViewController`.

`invalidate` is called upon each subsequent rendering of the `ViewController` component
(it is not called the first time). This function can be used to evaluate the `ViewModel`
store, invalidate it if necessary, and/or dispatch events that cause some action.

See more in [`ViewController` documentation](docs/ViewController.md).

## Performance analysis

### Child component rendering

One of the particular areas of concern for React applications is avoiding unnecessary
rendering of components not affected by state changes. Statium solves this problem by
scoping `ViewModel` state changes: setting any state key will start at the `ViewModel`
closest to the consumer Component, and climb up the `ViewModel` tree until the key
owner is found. Once the owner is found, the state will be modified and the owner
`ViewModel` and its children will be re-rendered in the usual way.

For the majority of use cases where rendering is caused by user interaction and
rendering performance is critical to maintain positive user experience, the consumer
Components doing the state updates will be either directly contained by the `ViewModel`
that holds their state, or be relatively close to it in the component tree. Since
only the affected `ViewModel` is rendered, the scope of rendering is always controlled.

### Read operations

Statium is designed to take advantage of the JavaScript's main strengths: its prototypal
object system. Each `ViewModel` store is linked to its parent via prototype chain to allow
for extemely cheap value reads at the component rendering time. Essentially the only extra
operations that are performed at value read time are binding normalization and formula
lookup, both of which add negligible amount of runtime cost.

### Write operations

Setting a value to a state key is a slightly more expensive operation than getting a value,
since it might involve climbing up the `ViewModel` tree to find the owner `ViewModel`
on which to call `setState()`. This, however, does not lead to observable real world
performance impact because of the inherently scoped nature of `ViewModel` store: most,
if not all, of the keys read and written by consumer Components tend to be relatively
close to the Components themselves in the component tree, i.e. contained in their parent
`ViewModel`, or its parent.
