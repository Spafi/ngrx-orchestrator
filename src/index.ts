import { createAction, on, props } from '@ngrx/store';
import { Draft, produce } from 'immer';

export type EmptyProp = null

type LoadActionProps<D> = {
    param: D
}

type SuccessActionProps<D> = {
    data: D
}

type ErrorActionProps = {
    errors: any
}

/*
 Computes string literal types that represent the paths to all properties within a type T.
 Useful for type-safe property access paths.
 */
type Paths<T> = T extends object
                ? {
                    [K in keyof T]:
                    `${ Exclude<K, symbol> }${ '' | `.${ Paths<T[K]> }` }`
                }[keyof T]
                : never


export interface GroupedActionsConfig {
    source: string;
    action: string;
}

/*
 Creates a set of actions for a specific data flow, including load, success, failure, and reset actions.
 */
export function createDataFlowActions<Input, Result>(
        config: GroupedActionsConfig) {

    const load = createAction(
            `[${ config.source }] ${ config.action }`, props<LoadActionProps<Input>>()
    );

    const loadSuccess = createAction(
            `[API] ${ config.action } Success`, props<SuccessActionProps<Result>>()
    );

    const loadFailure = createAction(
            `[API] ${ config.action } Failure`, props<ErrorActionProps>()
    );

    const reset = createAction(
            `[${ config.source }] ${ config.action } Reset`
    );

    return { load, loadSuccess, loadFailure, reset };
}

function getNestedState<State>(
        stateSelector: State extends object
                       ? { [K in keyof State]: `${ Exclude<K, symbol> }${ '' | `.${ Paths<State[K]> }` }` }[keyof State]
                       : never, nestedState: any): any {

    const possibleNestedPath = stateSelector.split( '.' );
    const isNestedPath = possibleNestedPath.length > 1;
    if ( !isNestedPath ) {
        return nestedState[stateSelector];
    }
    for ( let path of possibleNestedPath ) {
        nestedState = nestedState[path];
    }
    return nestedState;
}

/*
 Parses a string path and returns an object containing the parent path, the property name, and the full path without the property name.
 */
function getNestedStatePathName<State>(
        stateSelector: Paths<State>): {
    parentName: any;
    pathWithoutProperty: Paths<State>
    propertyName: any
} {

    const possibleNestedPath = stateSelector.split( '.' );
    const isNestedPath = possibleNestedPath.length > 1;
    if ( !isNestedPath ) {
        console.error( `${ stateSelector } is not a valid property path. Provide the name of the property that holds your data in state, not the name of the wrapper.` );

    }
    const propertyName = possibleNestedPath.pop() ?? stateSelector;
    const pathWithoutProperty = possibleNestedPath.join( '.' ) ?? stateSelector;

    const parentName = possibleNestedPath.pop() ?? stateSelector;
    return {
        propertyName,
        parentName,
        pathWithoutProperty: pathWithoutProperty as Paths<State>
    };
}

/*
 Sets up reducer handlers for an action group, integrating loading state and error handling.
 It supports optional integration with a custom reducer function for sophisticated state updates.
 */
export function onActionGroup<State, Data>(
        actionGroup: ReturnType<typeof createDataFlowActions<any, Data>>,
        stateSelector: Paths<State>,
        state: State,
        reducerFunction?: (state: State, data: Data) => Draft<State>
) {
    const { pathWithoutProperty, propertyName } = getNestedStatePathName( stateSelector );
    const initialData = getNestedState( stateSelector, state );
    const onLoad = on( actionGroup.load, (state: State) =>
            produce( state, draft => {
                         let nestedState: any = draft;
                         nestedState = getNestedState( pathWithoutProperty, nestedState );
                         nestedState.loading = true;
                         nestedState.errors = [];
                     }
            )
    );

    const onLoadSuccess = on( actionGroup.loadSuccess, (state: State, data: SuccessActionProps<Data>) =>
            produce( state, draft => {
                const nextState = reducerFunction
                                  ? reducerFunction( draft as any, data.data )
                                  : draft;
                let nestedState: any = nextState;
                nestedState = getNestedState( pathWithoutProperty, nestedState );
                if ( !reducerFunction ) {
                    nestedState[propertyName] = data.data;
                }

                nestedState.errors = [];
                nestedState.loading = false;

                return nextState;
            } )
    );

    const onLoadFailure = on( actionGroup.loadFailure, (state: State, errors: ErrorActionProps) =>
            produce( state, draft => {
                         let nestedState: any = draft;
                         nestedState = getNestedState( pathWithoutProperty, nestedState );
                         nestedState.loading = false;
                         nestedState.errors = errors.errors;
                     }
            )
    );

    const onReset = on( actionGroup.reset, (state: State) =>
            (
                    produce( state, draft => {
                        let nestedState: any = draft;
                        nestedState = getNestedState( pathWithoutProperty, nestedState );

                        nestedState[propertyName] = initialData;
                        nestedState.errors = [];
                        nestedState.loading = false;
                    } )
            )
    );

    return [ onLoad, onLoadSuccess, onLoadFailure, onReset ];

}
