import {
    identity,
    getFetchActionName,
    isFetchActionType,
    prependFetchAction,
    reduceReducers,
} from '../utils';
import { ACTION_NAME_TAGS } from '../constants';

/**
 * expand a fetch action handler to request, receive and failure handlers
 * @param {String} type
 * @param {Function} reducer
 * @param {*} defaultState
 */
export const expandFetchHandler = (type, reducer, defaultState) => {
    const fetchActionName = getFetchActionName(type);

    return {
        [prependFetchAction(
            fetchActionName,
            ACTION_NAME_TAGS.REQUEST,
        )]: state =>
            Object.assign({}, defaultState, state, {
                isFetching: true,
                error: null,
            }),

        [prependFetchAction(fetchActionName, ACTION_NAME_TAGS.RECEIVE)]: (
            state,
            action,
        ) =>
            Object.assign({}, state, reducer(state, action), {
                isFetching: false,
                error: null,
            }),

        [prependFetchAction(fetchActionName, ACTION_NAME_TAGS.FAILURE)]: (
            state,
            action,
        ) =>
            Object.assign({}, state, {
                isFetching: false,
                error: action.error,
            }),
    };
};

/**
 * expand all handlers to fetch handlers
 * @param {ArrayOf(Function)} handlers
 * @param {*} defaultState
 */
export const expandFetchHandlers = (handlers, defaultState) => {
    const expandedHandlers = {};

    Object.keys(handlers).forEach(actionName => {
        if (!actionName) {
            return;
        }

        if (isFetchActionType(actionName)) {
            Object.assign(
                expandedHandlers,
                expandFetchHandler(
                    actionName,
                    handlers[actionName],
                    defaultState,
                ),
            );
        } else {
            Object.assign(expandedHandlers, {
                [actionName]: handlers[actionName],
            });
        }
    });

    return expandedHandlers;
};

/**
 * handle a action
 * @param {String} type
 * @param {Function} reducer
 * @param {*} defaultState
 */
export const handleAction = (type, reducer = identity, defaultState) => (
    state = defaultState,
    action,
) => {
    if (!action.type || type !== action.type) return state;

    return reducer(state, action);
};

/**
 * handlers
 * @param {ArrayOf(Function)} handlers
 * @param {*} _defaultState
 */
export const handleActions = (handlers, _defaultState) => {
    const defaultFetchState = {
        isFetching: false,
        error: null,
    };
    const defaultState = Object.assign(defaultFetchState, _defaultState);

    const expandedHandlers = expandFetchHandlers(handlers);

    const reducers = Object.keys(expandedHandlers).map(type =>
        handleAction(type, expandedHandlers[type], defaultState),
    );
    const reducer = reduceReducers(...reducers);

    return (state = defaultState, action) => reducer(state, action);
};
