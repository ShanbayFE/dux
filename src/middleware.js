import { getFetchActionName, prependFetchAction, isFetchActionType } from './utils';
import { ACTION_NAME_TAGS } from './constants';

/**
 * redux middleware (need to add after redux-thunk)
 */
const duxMiddleware = ({ dispatch, getState }) => next => action => {
    if (action.type && isFetchActionType(action.type) && action.dataCreator) {
        const fetchActionName = getFetchActionName(action.type);
        const options = action.options || {};

        dispatch({
            type: prependFetchAction(fetchActionName, ACTION_NAME_TAGS.REQUEST),
            payloads: options.payloads,
        });

        const fetchAction = action.dataCreator(dispatch, getState);

        if (fetchAction && fetchAction.then != null) {
            return fetchAction
                .catch(error => {
                    dispatch({
                        type: prependFetchAction(
                            fetchActionName,
                            ACTION_NAME_TAGS.FAILURE,
                        ),
                        error,
                        payloads: options.payloads,
                    });

                    if (options.onError) options.onError(dispatch, getState);

                    throw error;
                })
                .then(data => {
                    if (!data) return null;

                    dispatch({
                        type: prependFetchAction(
                            fetchActionName,
                            ACTION_NAME_TAGS.RECEIVE,
                        ),
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
            type: prependFetchAction(fetchActionName, ACTION_NAME_TAGS.FAILURE),
            payloads: options.payloads,
            error: 'cancel',
        });

        return null;
    }

    return next(action);
};

export default duxMiddleware;
