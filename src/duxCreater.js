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
        },
        initState,
    );

    // actions
    const dataGetter = options.dataGetter;
    const baseUrl = options.baseUrl;

    dux.create = data =>
        createAction(ACTIONS.CREATE, () =>
            dataGetter(baseUrl, {
                method: 'POST',
                body: data,
            }),
        );

    dux.read = filter => {
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
            return createAction(ACTIONS.READ, () =>
                dataGetter(
                    baseUrl,
                    {
                        filters: filter,
                    },
                    {
                        payloads: { filter },
                    },
                ),
            );
        }

        return Promise.reject('Unknown ');
    };

    dux.update = (id, data) => {};

    dux.delete = id => {};

    dux.getEntities = store => {};
    dux.getEntity = store => {};

    return reducer;
};

export default dux;
