import { normalize, schema } from 'normalizr';

import { handleActions } from './reducer';
import { createAction } from './action';

import { generateAction, isFunction } from '../utils';
import { ACTION_NAME_TAGS } from '../constants';

const generateUrl = (customUrl, baseUrl, params) => {
    if (customUrl) {
        if (typeof customUrl === 'string') {
            return customUrl;
        }

        if (isFunction(customUrl)) {
            return customUrl(params);
        }
    }
    return baseUrl;
};

const checkId = id => {
    if (!id) {
        throw new Error('id is required');
    }

    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new Error(`id: "${id}" is invalid`);
    }
};

const dux = (entityName, options) => {
    const upperEntityName = entityName.toUpperCase();

    const entitySchema = new schema.Entity(entityName);
    const entitiesSchema = {
        objects: [entitySchema],
    };

    const ACTIONS = {
        CREATE: generateAction(
            ACTION_NAME_TAGS.FETCH,
            'CREATE',
            upperEntityName,
        ),
        READ: generateAction(ACTION_NAME_TAGS.FETCH, 'READ', upperEntityName),
        UPDATE: generateAction(
            ACTION_NAME_TAGS.FETCH,
            'UPDATE',
            upperEntityName,
        ),
        DELETE: generateAction(
            ACTION_NAME_TAGS.FETCH,
            'DELETE',
            upperEntityName,
        ),
    };

    const initState = {
        list: {
            filters: {},
            params: {},
            objects: [],
            page: 0,
            ipp: 20,
            total: 0,
        },
        entities: {},
    };

    const reducer = handleActions(
        {
            [ACTIONS.CREATE]: (state, action) =>
                Object.assign({}, state, {
                    entities: Object.assign({}, state.entities, {
                        [action.data.id]: action.data,
                    }),
                }),
            [ACTIONS.READ]: (state, action) => {
                if (action.payloads.id) {
                    return Object.assign({}, state, {
                        entities: Object.assign({}, state.entities, {
                            [action.payloads.id]: action.data,
                        }),
                    });
                }

                if (action.payloads.filters) {
                    return {
                        entities: Object.assign(
                            {},
                            state.entities,
                            action.data.entities[entityName],
                        ),
                        list: Object.assign(
                            {},
                            state.list,
                            action.data.result,
                            action.payloads.filters,
                        ),
                    };
                }

                throw new Error(`Unknown action "READ": ${action}`);
            },
            [ACTIONS.UPDATE]: (state, action) =>
                Object.assign({}, state, {
                    entities: Object.assign({}, state.entities, {
                        [action.payloads.id]: action.data,
                    }),
                }),
            [ACTIONS.DELETE]: (state, action) =>
                Object.assign({}, state, {
                    entities: Object.assign({}, state.entities, {
                        [action.payloads.id]: null,
                    }),
                }),
        },
        initState,
    );

    const entity = reducer;

    // actions
    const dataGetter = options.dataGetter;
    const baseUrl = options.baseUrl;

    entity.create = (data, actionOptions) =>
        createAction(ACTIONS.CREATE, () =>
            dataGetter(
                generateUrl(options.createUrl, baseUrl, actionOptions.params),
                {
                    method: 'POST',
                    body: data,
                },
            ),
        );

    entity.read = actionOptions => {
        const id = actionOptions.id;

        if (actionOptions.id) {
            checkId(actionOptions.id);

            return createAction(
                ACTIONS.READ,
                () => dataGetter(`${baseUrl}${id}/`),
                {
                    payloads: { id: actionOptions.id },
                },
            );
        }

        if (actionOptions.filters) {
            const filters = actionOptions.filters;
            const params = actionOptions.params;

            return createAction(
                ACTIONS.READ,
                () =>
                    dataGetter(
                        generateUrl(options.readListUrl, baseUrl, params),
                        { filters },
                    ).then(listData => normalize(listData, entitiesSchema)),
                {
                    payloads: { filters, params },
                },
            );
        }

        throw new Error(
            `Unknown args in action creater read: ${actionOptions}`,
        );
    };

    entity.update = (id, data) => {
        checkId(id);

        return createAction(ACTIONS.UPDATE, () =>
            dataGetter(
                `${baseUrl}${id}/`,
                {
                    method: 'PUT',
                    body: data,
                },
                {
                    payloads: { id },
                },
            ),
        );
    };

    entity.delete = id => {
        checkId(id);

        return createAction(ACTIONS.UPDATE, () =>
            dataGetter(
                `${baseUrl}${id}/`,
                {
                    method: 'DELETE',
                },
                {
                    payloads: { id },
                },
            ),
        );
    };

    // selectors
    entity.getList = (store, isSatisfy) => {
        const entityState = store[entityName];

        if (isSatisfy && !isSatisfy(entityState.list)) {
            return null;
        }

        return Object.assign({}, entityState.list, {
            objects: entityState.list.objects.map(
                objectId => entityState.entities[objectId],
            ),
        });
    };

    entity.getItem = (store, id) => {
        const entityState = store[entityName];

        return entityState.entities[id];
    };

    entity.select = (store, selectOptions) => {
        const entityState = store[entityName];

        if (selectOptions.id) {
            return entityState.entities[selectOptions.id];
        }

        if (
            selectOptions.isSatisfy &&
            !selectOptions.isSatisfy(entityState.list)
        ) {
            return null;
        }

        return Object.assign({}, entityState.list, {
            objects: entityState.list.objects.map(
                objectId => entityState.entities[objectId],
            ),
        });
    };

    return entity;
};

export default dux;
