import { SEPARATOR, ACTION_NAME_TAGS } from './constants';

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
export const prependFetchAction = (actionName, typePrefix) =>
    typePrefix + SEPARATOR + SEPARATOR + actionName;

/**
 * reduce reducers
 * @param {ArrayOf(Function)} reducers
 */
export const reduceReducers = (...reducers) => (previous, current) =>
    reducers.reduce((p, r) => r(p, current), previous);

/**
 * generate action
 * @param {String} args
 */
export const generateAction = (...args) => args.join(SEPARATOR);
