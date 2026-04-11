/**
 * Exercises the real pool module (not the manual mock). mysql2/promise is stubbed.
 */
const mockEnd = jest.fn().mockResolvedValue(undefined);
const mockCreatePool = jest.fn(() => ({ end: mockEnd }));

jest.mock('mysql2/promise', () => ({
    __esModule: true,
    default: {
        createPool: (...args: unknown[]) => mockCreatePool(...args),
    },
}));

jest.mock('../../util/environmentWrapper', () => ({
    getConnectionObject: jest.fn().mockResolvedValue({}),
}));

describe('database/pool (implementation)', () => {
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        process.env = { ...ORIGINAL_ENV };
        process.env.MYSQL_HOST = 'h';
        process.env.MYSQL_USER = 'u';
        process.env.MYSQL_PASS = 'p';
        process.env.MYSQL_DB = 'd';
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV;
    });

    it('initConfig copies MYSQL_* into connection config', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        const poolMod = require('../../database/pool');
        await poolMod.initConfig();
        expect(mockCreatePool).not.toHaveBeenCalled();
    });

    it('getPool creates a single mysql pool and destroyPool ends it', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        const poolMod = require('../../database/pool');
        await poolMod.initConfig();
        const a = poolMod.getPool();
        const b = poolMod.getPool();
        expect(a).toBe(b);
        expect(mockCreatePool).toHaveBeenCalledTimes(1);
        expect(mockCreatePool).toHaveBeenCalledWith(
            expect.objectContaining({
                host: 'h',
                user: 'u',
                password: 'p',
                database: 'd',
                timezone: '+00:00',
            }),
        );
        await poolMod.destroyPool();
        expect(mockEnd).toHaveBeenCalled();
        const c = poolMod.getPool();
        expect(c).not.toBe(a);
        expect(mockCreatePool).toHaveBeenCalledTimes(2);
    });
});
