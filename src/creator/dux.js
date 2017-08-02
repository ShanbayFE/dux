import { normalize, schema } from 'normalizr';

import { handleActions } from './reducer';
import { createAction } from './action';

import { generateAction, generateUrl, checkId, processData } from '../utils';
import { ACTION_NAME_TAGS } from '../constants';

const dux = (entityName, options) => {
    const upperEntityName = entityName.toUpperCase();

    const ACTIONS = {
        CREATE: generateAction(ACTION_NAME_TAGS.FETCH, 'CREATE', upperEntityName),
        READ: generateAction(ACTION_NAME_TAGS.FETCH, 'READ', upperEntityName),
        UPDATE: generateAction(ACTION_NAME_TAGS.FETCH, 'UPDATE', upperEntityName),
        DELETE: generateAction(ACTION_NAME_TAGS.FETCH, 'DELETE', upperEntityName),
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
                    list: Object.assign({}, state.list, {
                        objects: state.list.objects.concat(action.data.id),
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

                return {
                    entities: Object.assign({}, state.entities, action.data.entities[entityName]),
                    list: Object.assign({}, state.list, action.data.result, action.payloads),
                };
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
                    list: Object.assign({}, state.list, {
                        objects: state.list.objects.filter(item => item !== action.payloads.id),
                    }),
                }),
        },
        initState,
    );

    const entity = reducer;

    // actions
    const dataGetter = options.dataGetter;
    const baseUrl = options.baseUrl;

    entity.create = (data, actionOptions = {}) =>
        createAction(ACTIONS.CREATE, dispatch =>
            dataGetter(generateUrl(options.createUrl, baseUrl, actionOptions.params), {
                method: 'POST',
                body: data,
            }).then(result => {
                if (options.onUpdate) {
                    dispatch(options.onCreate(data, actionOptions));
                }

                return result;
            }),
        );

    entity.read = (actionOptions = {}) => (dispatch, getState) => {
        const id = actionOptions.id;

        if (actionOptions.id) {
            checkId(actionOptions.id);

            return dispatch(
                createAction(ACTIONS.READ, () => dataGetter(`${baseUrl}${id}/`), {
                    payloads: { id: actionOptions.id },
                }),
            );
        }

        let filters = actionOptions.filters;
        let params = actionOptions.params;

        if (actionOptions.flashBack) {
            const { list } = getState()[entityName];

            filters = list.filters;
            params = list.params;
        }

        return dispatch(
            createAction(
                ACTIONS.READ,
                () =>
                    dataGetter(generateUrl(options.readListUrl, baseUrl, params), {
                        filters,
                    }).then(listData =>
                        processData(entityName, actionOptions.schemaType, listData),
                    ),
                {
                    payloads: { filters, params },
                },
            ),
        );
    };

    entity.update = (id, data, actionOptions = {}) => {
        checkId(id);

        const params = actionOptions.params;

        return createAction(
            ACTIONS.UPDATE,
            dispatch =>
                dataGetter(`${generateUrl(options.updateUrl, baseUrl, params)}${id}/`, {
                    method: 'PUT',
                    body: data,
                }).then(result => {
                    if (options.onUpdate) {
                        dispatch(options.onUpdate(id, data, actionOptions));
                    }

                    return result;
                }),
            {
                payloads: { id },
            },
        );
    };

    entity.delete = (id, actionOptions = {}) => {
        checkId(id);

        const params = actionOptions.params;

        return createAction(
            ACTIONS.DELETE,
            dispatch =>
                dataGetter(`${generateUrl(options.delete, baseUrl, params)}${id}/`, {
                    method: 'DELETE',
                }).then(result => {
                    if (options.onUpdate) {
                        dispatch(options.onDelete(id, actionOptions));
                    }

                    return result;
                }),
            {
                payloads: { id },
            },
        );
    };

    // selectors
    entity.getList = (store, isSatisfy) => {
        const entityState = store[entityName];

        if (isSatisfy && !isSatisfy(entityState.list)) {
            return null;
        }

        return Object.assign({}, entityState.list, {
            objects: entityState.list.objects.map(objectId => entityState.entities[objectId]),
        });
    };

    entity.getListArr = (store, isSatisfy) => {
        const entityState = store[entityName];

        if (isSatisfy && !isSatisfy(entityState.list)) {
            return null;
        }

        return entityState.list.objects.map(objectId => entityState.entities[objectId]);
    };

    entity.getItem = (store, id) => {
        const entityState = store[entityName];

        return entityState.entities[id];
    };

    entity.getEntity = store => {
        const entityState = store[entityName];

        return entityState.entities;
    };

    entity.select = (store, selectOptions) => {
        const entityState = store[entityName];

        if (selectOptions.id) {
            return entityState.entities[selectOptions.id];
        }

        if (selectOptions.isSatisfy && !selectOptions.isSatisfy(entityState.list)) {
            return null;
        }

        return Object.assign({}, entityState.list, {
            objects: entityState.list.objects.map(objectId => entityState.entities[objectId]),
        });
    };

    return entity;
};

export default dux;
