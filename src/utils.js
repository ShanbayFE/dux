import { normalize, schema } from 'normalizr';

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

/**
 * check whether val is a function
 * @param {*} val
 */
export const isFunction = val => Object.prototype.toString.call(val) === '[object Function]';

export const generateUrl = (customUrl, baseUrl, params) => {
    if (customUrl) {
        if (typeof customUrl === 'string') {
            return customUrl;
        }

        if (isFunction(customUrl)) {
            return customUrl(params);
        }
    }

    if (isFunction(baseUrl)) {
        return baseUrl(params);
    }

    return baseUrl;
};

export const checkId = id => {
    if (!id) {
        throw new Error('id is required');
    }

    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new Error(`id: "${id}" is invalid`);
    }
};

export const processData = (entityName, schemaType, data) => {
    const entity = new schema.Entity(entityName);
    const entitiesSchemas = {
        array: [entity],
        objects: {
            objects: [entity],
        },
        object: entity,
    };

    if (schemaType) {
        if (typeof schemaType === 'object') {
            return normalize(data, schemaType);
        }

        return normalize(data, entitiesSchemas[schemaType]);
    }

    if (Array.isArray(data)) {
        const normalizedData = normalize(data, entitiesSchemas.array);
        normalizedData.result = { objects: normalizedData.result };
        return normalizedData;
    }

    if (data.objects && data.total) {
        return normalize(data, entitiesSchemas.objects);
    }

    const normalizedData = normalize(data, entitiesSchemas.object);
    normalizedData.result = { objects: [normalizedData.result] };
    return normalizedData;
};
