jest.mock('../../util/environmentWrapper', () => ({
    getCognitoPoolId: jest.fn().mockResolvedValue('pool-1'),
}));

jest.mock('../../util/email', () => ({
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
}));

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
    const actual = jest.requireActual('@aws-sdk/client-cognito-identity-provider');
    return {
        ...actual,
        CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
            send: mockSend,
        })),
    };
});

import {
    AdminCreateUserCommand,
    AdminAddUserToGroupCommand,
    AdminDeleteUserCommand,
    AdminSetUserPasswordCommand,
    AdminResetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { sendPasswordReset } from '../../util/email';
import {
    createCognitoUser,
    deleteCognitoUser,
    resetCognitoPassword,
    updateCognitoUserEmail,
} from '../../util/cognito';

const mockedSendPwReset = sendPasswordReset as jest.MockedFunction<typeof sendPasswordReset>;

describe('util/cognito', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof AdminCreateUserCommand) {
                return { User: { Username: 'uuid-abc' } };
            }
            return {};
        });
    });

    it('createCognitoUser creates user and adds member group', async () => {
        const uuid = await createCognitoUser('a@b.com', false, 'tenant-1');
        expect(uuid).toBe('uuid-abc');
        const sendCalls = mockSend.mock.calls;
        expect(sendCalls[0][0]).toBeInstanceOf(AdminCreateUserCommand);
        const addGroupCalls = sendCalls.filter(
            ([cmd]: [unknown]) => cmd instanceof AdminAddUserToGroupCommand,
        );
        expect(addGroupCalls).toHaveLength(1);
        expect(addGroupCalls[0][0].input).toEqual(
            expect.objectContaining({ GroupName: 'member', Username: 'uuid-abc' }),
        );
    });

    it('createCognitoUser adds membershipAdmin group when requested', async () => {
        await createCognitoUser('c@d.com', true, 'tenant-1');
        const addGroupCalls = mockSend.mock.calls.filter(
            ([cmd]: [unknown]) => cmd instanceof AdminAddUserToGroupCommand,
        );
        expect(addGroupCalls).toHaveLength(2);
        expect(addGroupCalls[1][0].input).toEqual(
            expect.objectContaining({ GroupName: 'membershipAdmin' }),
        );
    });

    it('createCognitoUser throws when addUserToGroup fails', async () => {
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof AdminCreateUserCommand) {
                return { User: { Username: 'uuid-abc' } };
            }
            if (command instanceof AdminAddUserToGroupCommand) {
                throw new Error('group err');
            }
            return {};
        });
        await expect(createCognitoUser('e@f.com', false, 't')).rejects.toThrow('group err');
    });

    it('deleteCognitoUser calls adminDeleteUser', async () => {
        await deleteCognitoUser('uuid-x');
        const deleteCalls = mockSend.mock.calls.filter(
            ([cmd]: [unknown]) => cmd instanceof AdminDeleteUserCommand,
        );
        expect(deleteCalls).toHaveLength(1);
        expect(deleteCalls[0][0].input).toEqual(
            expect.objectContaining({ UserPoolId: 'pool-1', Username: 'uuid-x' }),
        );
    });

    it('updateCognitoUserEmail calls adminUpdateUserAttributes', async () => {
        await updateCognitoUserEmail({
            uuid: 'u1',
            email: 'new@x.com',
        } as any);
        expect(mockSend).toHaveBeenCalled();
    });

    it('resetCognitoPassword uses adminSetUserPassword when default provided', async () => {
        const member = {
            uuid: 'u1',
            email: 'm@x.com',
            firstName: 'A',
            lastName: 'B',
            tenantId: 't1',
        } as any;
        await resetCognitoPassword(member, 'Temp123!');
        const setPwCalls = mockSend.mock.calls.filter(
            ([cmd]: [unknown]) => cmd instanceof AdminSetUserPasswordCommand,
        );
        const resetPwCalls = mockSend.mock.calls.filter(
            ([cmd]: [unknown]) => cmd instanceof AdminResetUserPasswordCommand,
        );
        expect(setPwCalls).toHaveLength(1);
        expect(resetPwCalls).toHaveLength(0);
        expect(mockedSendPwReset).toHaveBeenCalledWith(member, 'Temp123!', 't1');
    });

    it('resetCognitoPassword uses adminResetUserPassword when default empty', async () => {
        const member = {
            uuid: 'u2',
            email: 'm2@x.com',
            firstName: 'C',
            lastName: 'D',
            tenantId: 't1',
        } as any;
        await resetCognitoPassword(member, '');
        const resetPwCalls = mockSend.mock.calls.filter(
            ([cmd]: [unknown]) => cmd instanceof AdminResetUserPasswordCommand,
        );
        const setPwCalls = mockSend.mock.calls.filter(
            ([cmd]: [unknown]) => cmd instanceof AdminSetUserPasswordCommand,
        );
        expect(resetPwCalls).toHaveLength(1);
        expect(setPwCalls).toHaveLength(0);
        expect(mockedSendPwReset).toHaveBeenCalledWith(member, '', 't1');
    });
});
