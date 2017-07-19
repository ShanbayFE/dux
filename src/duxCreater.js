import { handleActions } from './reducerCreater';
import { createAction } from './actionCreater';
import { generateAction } from './utils';
import { ACTION_NAME_TAGS } from './constants';

const dux = (entityName, options) => {
    const upperEntityName = entityName.toUpperCase();

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
            objects: [],
            filters: {},
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

                if (action.payloads.filter) {
                    return Object.assign({}, state, {
                        entities: Object.assign({}, state.entities, {
                            [action.payloads.id]: action.data,
                        }),
                    });
                }

                console.error('Unknown action `READ`: ', action);
                return state;
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

    entity.create = data =>
        createAction(ACTIONS.CREATE, () =>
            dataGetter(baseUrl, {
                method: 'POST',
                body: data,
            }),
        );

    entity.read = filter => {
        if (typeof filter === 'string') {
            return createAction(
                ACTIONS.READ,
                () => dataGetter(`${baseUrl}${filter}/`),
                {
                    payloads: { id: filter },
                },
            );
        }

        if (typeof filter === 'object') {
            return createAction(
                ACTIONS.READ,
                () =>
                    dataGetter(baseUrl, {
                        filters: filter,
                    }),
                {
                    payloads: { filter },
                },
            );
        }

        return Promise.reject('Unknown args in action creater read: ', filter);
    };

    entity.update = (id, data) =>
        createAction(ACTIONS.UPDATE, () =>
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

    entity.delete = id =>
        createAction(ACTIONS.UPDATE, () =>
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

    entity.getEntity = store => {};

    return entity;
};

export default dux;
