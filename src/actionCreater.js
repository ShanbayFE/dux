import { identity } from './utils';

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
export const createAction = (type, payloadsCreator = identity, options) => {
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
