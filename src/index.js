// CONSTANTS
const SEPARATOR = '_';

const ACTION_NAME_TAGS = {
    FETCH: 'FETCH',
    REQUEST: 'REQUEST_',
    RECEIVE: 'RECEIVE_',
    FAILURE: 'FAILURE_',
};

/**
 * This method returns the first argument it receives.
 * @param {*} v
 */
export const identity = v => v;

/**
 * is action type satisfied with prefix requirement
 * @param {String} actionType
 * @param {String} predictType
 */
export const isActionSatisfied = (actionType, predictType) =>
    actionType.indexOf(predictType + SEPARATOR) === 0;

/**
 * is action type satisfied with FETCH requirement
 * @param {String} actionType
 */
export const isFetchActionType = actionType =>
    isActionSatisfied(actionType, ACTION_NAME_TAGS.FETCH);

/**
 * get actual action name from fetch action type
 * @param {String} actionType
 */
export const getFetchActionName = actionType =>
    actionType.split(ACTION_NAME_TAGS.FETCH + SEPARATOR)[1];

/**
 * append prefix to action type
 * @param {String} actionName
 * @param {String} typePrefix
 */
export const appendActionType = (actionName, typePrefix) => typePrefix + SEPARATOR + actionName;

/**
 * redux middleware (need to add after redux-thunk)
 */
export const bayFetchMiddleware = ({ dispatch, getState }) => next => action => {
    if (action.type && isFetchActionType(action.type) && action.dataCreator) {
        const fetchActionName = getFetchActionName(action.type);
        const options = action.options || {};

        dispatch({
            type: appendActionType(fetchActionName, ACTION_NAME_TAGS.REQUEST),
            payloads: options.payloads,
        });

        const fetchAction = action.dataCreator(dispatch, getState);

        if (fetchAction && fetchAction.then != null) {
            return fetchAction
                .catch(error => {
                    dispatch({
                        type: appendActionType(fetchActionName, ACTION_NAME_TAGS.FAILURE),
                        error,
                        payloads: options.payloads,
                    });

                    if (options.onError) options.onError(dispatch, getState);

                    throw error;
                })
                .then(data => {
                    if (!data) return null;

                    dispatch({
                        type: appendActionType(fetchActionName, ACTION_NAME_TAGS.RECEIVE),
                        data,
                        payloads: options.payloads,
                    });

                    if (options.onSuccess) {
                        options.onSuccess(data, dispatch, getState);
                    }

                    return data;
                });
        }

        dispatch({
            type: appendActionType(fetchActionName, ACTION_NAME_TAGS.FAILURE),
            payloads: options.payloads,
            error: 'cancel',
        });

        return null;
    }

    return next(action);
};

/**
 * create a fetch action
 * @param  {[String]} type    [Type String]
 * @param  {[Function]} dataCreator [dataCreator method: like fetch()]
 * @param  {[object]} options [{ onSuccess, onError, payloads}]
 * @return {[object]}         [a redux action]
 */
export const createFetchAction = (type, dataCreator, options) => ({
    type,
    dataCreator,
    options,
});

/**
 * create a normal action
 * @param {String} type
 * @param {Function} payloadsCreator
 */
export const createAction = (type, payloadsCreator = identity) => {
    const actionCreator = (...args) => {
        const action = {
            type,
        };

        action.payloads = payloadsCreator(...args);

        return action;
    };

    actionCreator.toString = () => type.toString();

    return actionCreator;
};

/**
 * expand a fetch action handler to request, receive and failure handlers
 * @param {String} type
 * @param {Function} reducer
 * @param {*} defaultState
 */
export const expandFetchHandler = (type, reducer, defaultState) => {
    const fetchActionName = getFetchActionName(type);

    return {
        [appendActionType(fetchActionName, ACTION_NAME_TAGS.REQUEST)]: state =>
            Object.assign({}, defaultState, state, {
                isFetching: true,
                error: null,
            }),

        [appendActionType(fetchActionName, ACTION_NAME_TAGS.RECEIVE)]: (state, action) =>
            Object.assign({}, state, reducer(state, action), {
                isFetching: false,
                error: null,
            }),

        [appendActionType(fetchActionName, ACTION_NAME_TAGS.FAILURE)]: (state, action) =>
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
                expandFetchHandler(actionName, handlers[actionName], defaultState),
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
 * reduce reducers
 * @param {ArrayOf(Function)} reducers
 */
export const reduceReducers = (...reducers) => (previous, current) =>
    reducers.reduce((p, r) => r(p, current), previous);

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
