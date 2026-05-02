/* eslint-disable no-var */
jest.unmock('../../util/environmentWrapper');

var mockSsmResult: unknown = { Parameter: { Value: 'param-value' } };
var mockSsmReject: unknown;
var mockSecretString = '{"accessToken":"t"}';

var mockSsmSend = jest.fn();
var mockSecretsSend = jest.fn();

jest.mock('@aws-sdk/client-ssm', () => {
    const actual = jest.requireActual('@aws-sdk/client-ssm');
    return {
        ...actual,
        SSMClient: jest.fn().mockImplementation(() => ({
            send: (...args: any[]) => mockSsmSend(...args),
        })),
    };
});

jest.mock('@aws-sdk/client-secrets-manager', () => {
    const actual = jest.requireActual('@aws-sdk/client-secrets-manager');
    return {
        ...actual,
        SecretsManagerClient: jest.fn().mockImplementation(() => ({
            send: (...args: any[]) => mockSecretsSend(...args),
        })),
    };
});

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
        mockSsmSend.mockImplementation(async () => {
            if (mockSsmReject) throw mockSsmReject;
            return mockSsmResult;
        });
        mockSecretsSend.mockImplementation(async () => ({
            SecretString: mockSecretString,
            Name: 'test-secret',
        }));
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

    it('getConnectionObject parses RDS secret', async () => {
        process.env.RDS_CONNECTION_ID = 'rds_fake_one';
        mockSecretString = '{"user":"u"}';
        const obj = await getConnectionObject();
        expect(obj).toEqual({ user: 'u' });
    });

});
