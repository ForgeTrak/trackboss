/** Jest manual mock for `database/pool` — use `jest.mock('../../database/pool')` from tests. */
export const mockQuery = jest.fn();
/** Queries run on a pooled connection (`insertEvent`, etc.) */
export const mockConnQuery = jest.fn();
export const mockRelease = jest.fn();

function defaultPool() {
    return {
        query: mockQuery,
        getConnection: jest.fn().mockResolvedValue({
            query: mockConnQuery,
            release: mockRelease,
        }),
    };
}

/** `jest.fn` so API tests can `mockReturnValue({ query: ... })`; default impl matches database tests. */
export const getPool = jest.fn(defaultPool);

export async function initConfig(): Promise<void> {
    /* no-op */
}

export async function destroyPool(): Promise<void> {
    /* no-op */
}
