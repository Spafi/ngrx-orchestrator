# NgRxOrchestrator

A Powerful State Management Toolkit for Angular


> The library is in early development!

## What is NgRxOrchestrator?

NgRxOrchestrator is a comprehensive toolkit designed to streamline the management of application state in Angular
projects using the Redux pattern with NgRx. By integrating immer for immutable state transformations, NgRxOrchestrator
simplifies the creation and handling of action-driven state changes, enhancing the readability and maintainability of
your code. This library provides a set of utilities that automate the boilerplate of setting up and managing state
flows, including loading, success, and error handling for asynchronous operations. Whether you are building a complex
enterprise-level application or a simple interactive interface, NgRxOrchestrator helps you implement a clean, scalable,
and
efficient state management architecture.

## Features

- **Automated Action Groups**: Generate load, success, failure, and reset actions seamlessly.
- **Immutable State Management**: Leverage immer for safe, straightforward state updates even in deeply nested
  structures.
- **Type Safety**: Utilize TypeScript for robust type checking and IntelliSense support throughout your state management
  logic.
- **Flexible Integration**: Easily integrate with existing Angular and NgRx projects, enhancing functionality without
  disrupting current architectures.

## Dependencies

NgRxOrchestrator depends on [@ngrx/store](https://github.com/ngrx/platform)
and [immer](https://github.com/immerjs/immer)

## Usage

```ts
createDataFlowActions<Input, Result>(
        {
            source: 'Source',
            action: 'Action description'
        }
)
```

`createDataFlowActions` returns an object containing 4 actions: `{ load, loadSuccess, loadFailure, reset }`

The `Input` type is used as prop on the `load` action

The `Result` type is used as prop on the `loadSuccess` action

#

####

In your `someState.actions.ts`

<table>
<tr>
<th>After</th>
<th>Before</th>

</tr>
<tr>
<td width="50%">

```ts
export const loadSomeStateDetails =
        createDataFlowActions<string, SomeDto>(
                {
                    source: 'Some State Details',
                    action: 'Load some state details'
                } );














```

</td>
<td width="50%">

```ts
export const loadSomeStateDetails = createAction(
        '[Some State Details] Load some state details',
        props<{ id: string }>()
);

export const successfullyLoadedSomeStateDetails = createAction(
        '[API] Successfully loaded some state details',
        props<{ data: SomeDto }>()
);

export const failedToLoadSomeStateDetails = createAction(
        '[API] Failed to load some state details',
        props<{ errors: AppError[] }>()
);

export const resetSomeStateDetails = createAction(
        '[Some State Details] Reset some state details'
);


```

</td>
</tr>
</table>

#

#### In your `someState.reducer.ts`

```ts
export interface SomeState {
    details: {
        data: DummyObject
        // You need to add loading and errors properties 
        // in your state definition to be able to select them
        loading: boolean
        errors: any[],
    };
}

export const initialState: SomeState = {
    details: {
        data   : null,
        loading: false,
        errors : []
    },
}
```

<table>
    <tr>
        <th>After</th>
        <th>Before</th>
    </tr>
    <tr>

```ts
export const reducer = createReducer(
        initialState,
```

</tr>
<tr>
<td width="50%">

```ts
// Notice the destructuring 
...
onActionGroup(
        // the action group created with createDataFlowAction
        loadSomeStateDetails,
        // the path of your data from the state 
        'details.data',
        // the object containing the default state
        initialState
)
```

```ts






























```

</td>
<td width="50%">

```ts
on( loadSomeStateDetails, (state, { id }) => (
        {
            ...state,
            details: {
                ...state.details,
                loading: true,
                errors : []
            }
        }
) )

on( successfullyLoadedSomeStateDetails, (state, { data }) => (
        {
            ...state,
            details: {
                ...state.details,
                loading: false,
                errors : [],
                data
            }
        }
) )

on( failedToLoadSomeStateDetails, (state, { errors }) => (
        {
            ...state,
            details: {
                ...state.details,
                loading: false,
                errors,
            }
        }
) )

on( resetSomeStateDetails, (state) => (
        {
            ...state,
            details: {
                ...initialState.details
            }
        }
) )
```

</td>
</tr>
</table>

#

### Relevant reducer mentions

```ts
onActionGroup(
        actionGroup,
        dataPathFromState,
        initialState,
        reducerFunction ?
)
```

`onActionGroup` returns an array containing 4 ons to be used in the reducer:

`[ onLoad, onLoadSuccess, onLoadFailure, onReset ]`

`onActionGroup` by default sets the result of its `loadSuccess` action in the `dataPathFromState` property of your state

#

> [!IMPORTANT] You can pass a fourth parameter to `onActionGroup` for sophisticated state updates

#

> You can use immer's `produce` function to handle the state update:

```ts
onActionGroup( deleteSomeData,
               'list.data',
               initialState,
               (state, deletedId) =>
                       produce( state, draft => {
                                    draft.list.data = draft.list.data.filter( d => d.id!=deletedId );
                                }
                       )
)
```

#

> Or by manually destructuring and updating the state:

```ts
onActionGroup( deleteSomeData,
               'list.data',
               initialState,
               (state, deletedId) => (
                       {
                           ...state,
                           list: {
                               ...state.list,
                               data: state.list.data.filter( d => d.id!=deletedId )
                           }
                       }
               )
)
```

#

#### In your component that needs to load the data

```ts
this.store.dispatch( loadSomeStateDetails.load( { param: id } ) );
```

#

#### In your `someState.selectors.ts`  (Selectors remain unchanged)

```ts
export const someStateDetails = createSelector(
        selectSomeState,
        // You need to select the whole object containing 
        // your data, loading and errors if you want to use the loading and errors properties
        (state: SomeState) => state.details
);
```

#

#### In your component that needs to get the data (Selecting the state remains unchanged)

```ts
data$ = this.store.select( someStateDetails );
// data$ Is an Observable of your data, errors and loading
```
