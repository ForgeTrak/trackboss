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

/** Prevent any test from reaching AWS Secrets Manager / SSM. */
jest.mock('../util/environmentWrapper', () => ({
    getEnvironmentParameter: jest.fn().mockResolvedValue(''),
    getCognitoPoolId: jest.fn().mockResolvedValue(''),
    getCognitoClientId: jest.fn().mockResolvedValue(''),
    getSquareObject: jest.fn().mockResolvedValue({}),
    getConnectionObject: jest.fn().mockResolvedValue({}),
}));
