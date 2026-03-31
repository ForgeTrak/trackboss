/* eslint-disable no-var */
var mockSsmResult: unknown = { Parameter: { Value: 'param-value' } };
var mockSsmReject: unknown;
var mockSecretString = '{"accessToken":"t"}';

jest.mock('aws-sdk', () => ({
    SSM: jest.fn().mockImplementation(() => ({
        getParameter: jest.fn().mockImplementation(() => ({
            promise: jest.fn().mockImplementation(() => {
                if (mockSsmReject) {
                    return Promise.reject(mockSsmReject);
                }
                return Promise.resolve(mockSsmResult);
            }),
        })),
    })),
    SecretsManager: jest.fn().mockImplementation(() => ({
        getSecretValue: jest.fn().mockImplementation(() => ({
            promise: jest.fn().mockImplementation(() =>
                Promise.resolve({ SecretString: mockSecretString }),
            ),
        })),
    })),
}));

import {
    getCognitoClientId,
    getCognitoPoolId,
    getConnectionObject,
    getEnvironmentParameter,
    getSquareObject,
} from '../../util/environmentWrapper';

describe('util/environmentWrapper', () => {
    beforeEach(() => {
        mockSsmReject = undefined;
        mockSsmResult = { Parameter: { Value: 'param-value' } };
        mockSecretString = '{"accessToken":"t"}';
        jest.clearAllMocks();
    });

    it('getEnvironmentParameter returns SSM value', async () => {
        const v = await getEnvironmentParameter('myKey');
        expect(v).toBe('param-value');
    });

    it('getEnvironmentParameter returns empty string on SSM error', async () => {
        mockSsmReject = new Error('ssm down');
        const v = await getEnvironmentParameter('missing');
        expect(v).toBe('');
    });

    it('getCognitoPoolId and getCognitoClientId delegate to getEnvironmentParameter', async () => {
        mockSsmResult = { Parameter: { Value: 'pool-x' } };
        await expect(getCognitoPoolId()).resolves.toBe('pool-x');
        mockSsmResult = { Parameter: { Value: 'client-y' } };
        await expect(getCognitoClientId()).resolves.toBe('client-y');
    });

    it('getSquareObject parses secret JSON and returns same object on second call', async () => {
        mockSecretString = '{"square":"one"}';
        const a = await getSquareObject();
        const b = await getSquareObject();
        expect(a).toEqual({ square: 'one' });
        expect(b).toEqual(a);
    });

    it('getConnectionObject parses RDS secret', async () => {
        mockSecretString = '{"user":"u"}';
        const obj = await getConnectionObject();
        expect(obj).toEqual({ user: 'u' });
    });

});
