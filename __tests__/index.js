import * as duxFetch from '../src';

describe('isActionSatisfied', () => {
    it('FETCH_TEST', () => {
        expect(duxFetch.isActionSatisfied('FETCH_TEST', 'FETCH')).toBe(true);
    });

    it('FETCH_', () => {
        expect(duxFetch.isActionSatisfied('FETCH_', 'FETCH')).toBe(true);
    });

    it('FETCH_VERY_LONG', () => {
        expect(duxFetch.isActionSatisfied('FETCH_VERY_LONG', 'FETCH')).toBe(true);
    });

    it('FETCH', () => {
        expect(duxFetch.isActionSatisfied('FETCH', 'FETCH')).toBe(false);
    });

    it('FETCH_', () => {
        expect(duxFetch.isActionSatisfied('FETCH_', 'FETCH_')).toBe(false);
    });

    it('', () => {
        expect(duxFetch.isActionSatisfied('', 'FETCH')).toBe(false);
    });
});

describe('isFetchActionType', () => {
    it('FETCH_TEST', () => {
        expect(duxFetch.isFetchActionType('FETCH_TEST')).toBe(true);
    });

    it('FETCH_', () => {
        expect(duxFetch.isFetchActionType('FETCH_')).toBe(true);
    });

    it('FETCH_VERY_LONG', () => {
        expect(duxFetch.isFetchActionType('FETCH_VERY_LONG')).toBe(true);
    });

    it('FETCH', () => {
        expect(duxFetch.isFetchActionType('FETCH')).toBe(false);
    });

    it('FEE_A', () => {
        expect(duxFetch.isFetchActionType('FEE_A')).toBe(false);
    });

    it('', () => {
        expect(duxFetch.isFetchActionType('')).toBe(false);
    });
});

describe('getFetchActionName', () => {
    it('FETCH_TEST', () => {
        expect(duxFetch.getFetchActionName('FETCH_TEST')).toBe('TEST');
    });
    it('FETCH_', () => {
        expect(duxFetch.getFetchActionName('FETCH_')).toBe('');
    });
    it('FETCH_VERY_LONG', () => {
        expect(duxFetch.getFetchActionName('FETCH_VERY_LONG')).toBe('VERY_LONG');
    });
});

describe('appendActionType', () => {
    it('append a to b', () => {
        expect(duxFetch.appendActionType('b', 'a')).toBe('a_b');
    });
});

describe('createFetchAction', () => {
    it('normal fetch action', () => {
        const dataCreator = () => ({ data: 'test' });
        const options = {};

        expect(duxFetch.createFetchAction('FETCH_TEST', dataCreator, options)).toEqual({
            type: 'FETCH_TEST',
            dataCreator,
            options,
        });
    });
});

describe('createAction', () => {
    it('normal action', () => {
        const payloadsCreator = () => ({ data: 'test' });

        expect(duxFetch.createAction('TEST', payloadsCreator)()).toEqual({
            type: 'TEST',
            payloads: { data: 'test' },
        });
    });
});

describe('expandFetchHandler', () => {
    describe('normal fetch handler', () => {
        const testAction = { data: { objects: 'test' }, error: 'test' };

        const handlers = duxFetch.expandFetchHandler(
            'FETCH_TEST',
            (state, action) => ({
                objects: action.data.objects,
            }),
            {
                default: true,
            },
        );

        it('request handler', () => {
            expect(handlers.REQUEST__TEST({}, testAction)).toEqual({
                default: true,
                isFetching: true,
                error: null,
            });
        });

        it('receive handler', () => {
            expect(handlers.RECEIVE__TEST({}, testAction)).toEqual({
                isFetching: false,
                error: null,
                objects: 'test',
            });
        });

        it('failure handler', () => {
            expect(handlers.FAILURE__TEST({}, testAction)).toEqual({
                isFetching: false,
                error: 'test',
            });
        });
    });
});

describe('expandFetchHandlers', () => {
    it('empty', () => {
        expect(duxFetch.expandFetchHandlers({})).toEqual({});
    });

    it('only other handler', () => {
        const handler = () => {};
        expect(
            duxFetch.expandFetchHandlers({
                TEST: handler,
            }),
        ).toEqual({
            TEST: handler,
        });
    });

    it('only fetch handler', () => {
        const handler = () => {};
        const handlers = duxFetch.expandFetchHandlers({
            FETCH_TEST: handler,
        });

        expect(handlers.FETCH_TEST).toBeUndefined();
        expect(handlers.REQUEST__TEST).toBeInstanceOf(Function);
        expect(handlers.RECEIVE__TEST).toBeInstanceOf(Function);
        expect(handlers.FAILURE__TEST).toBeInstanceOf(Function);
    });

    it('fetch with other handler', () => {
        const handler = () => {};
        const handlers = duxFetch.expandFetchHandlers({
            FETCH_TEST: handler,
            TEST: handler,
        });

        expect(handlers.FETCH_TEST).toBeUndefined();
        expect(handlers.TEST).toEqual(handler);
        expect(handlers.REQUEST__TEST).toBeInstanceOf(Function);
        expect(handlers.RECEIVE__TEST).toBeInstanceOf(Function);
        expect(handlers.FAILURE__TEST).toBeInstanceOf(Function);
    });
});

describe('reduceReducers', () => {
    it('single reducer', () => {
        const reducer = duxFetch.reduceReducers((p, c) => p + c);

        expect(reducer(1, 2)).toBe(3);
    });

    it('multi reducer', () => {
        const reducer = duxFetch.reduceReducers(
            (p, c) => p + c,
            (p, c) => p * c,
            (p, c) => p + c,
            (p, c) => p * c,
        );
        expect(reducer(1, 2)).toBe(16);
    });
});

describe('handleAction', () => {
    const { handleAction } = duxFetch;

    const type = 'TYPE';
    const prevState = { counter: 3 };
    const defaultState = { counter: 0 };

    describe('single handler form', () => {
        describe('resulting reducer', () => {
            it('returns previous state if type does not match', () => {
                const reducer = handleAction('NOTTYPE', () => null, defaultState);
                expect(reducer(prevState, { type })).toEqual(prevState);
            });

            it('returns default state if type does not match', () => {
                const reducer = handleAction('NOTTYPE', () => null, { counter: 7 });
                expect(reducer(undefined, { type })).toEqual({
                    counter: 7,
                });
            });

            it('accepts single function as handler', () => {
                const reducer = handleAction(
                    type,
                    (state, action) => ({
                        counter: state.counter + action.payload,
                    }),
                    defaultState,
                );
                expect(reducer(prevState, { type, payload: 7 })).toEqual({
                    counter: 10,
                });
            });

            it('accepts a default state used when the previous state is undefined', () => {
                const reducer = handleAction(
                    type,
                    (state, action) => ({
                        counter: state.counter + action.payload,
                    }),
                    { counter: 3 },
                );

                expect(reducer(undefined, { type, payload: 7 })).toEqual({
                    counter: 10,
                });
            });
        });
    });
});

describe('handleActions', () => {
    const { handleActions } = duxFetch;
    const defaultState = { counter: 0 };

    it('create a single handler from a map of multiple action handlers', () => {
        const reducer = handleActions(
            {
                INCREMENT: ({ counter }, { payload: amount }) => ({
                    counter: counter + amount,
                }),

                DECREMENT: ({ counter }, { payload: amount }) => ({
                    counter: counter - amount,
                }),
            },
            defaultState,
        );

        expect(reducer({ counter: 3 }, { type: 'INCREMENT', payload: 7 })).toEqual({
            counter: 10,
        });
        expect(reducer({ counter: 10 }, { type: 'DECREMENT', payload: 7 })).toEqual({
            counter: 3,
        });
    });

    it('accepts a default state used when previous state is undefined', () => {
        const reducer = handleActions(
            {
                INCREMENT: ({ counter }, { payload: amount }) => ({
                    counter: counter + amount,
                }),

                DECREMENT: ({ counter }, { payload: amount }) => ({
                    counter: counter - amount,
                }),
            },
            { counter: 3 },
        );

        expect(reducer(undefined, { type: 'INCREMENT', payload: 7 })).toEqual({
            counter: 10,
        });
    });

    it('accepts action function as action type', () => {
        const incrementAction = duxFetch.createAction('INCREMENT');
        const reducer = handleActions(
            {
                [incrementAction]: ({ counter }, { payloads: amount }) => ({
                    counter: counter + amount,
                }),
            },
            defaultState,
        );

        expect(reducer({ counter: 3 }, incrementAction(7))).toEqual({
            counter: 10,
        });
    });
});
