/** Ensures database/pool and other modules can load when real DB files are parsed for automocking. */
jest.mock('../logger', () => ({
    __esModule: true,
    default: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));
