jest.mock('../../util/environmentWrapper', () => ({
    getCognitoPoolId: jest.fn().mockResolvedValue('pool-1'),
}));

jest.mock('../../util/email', () => ({
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
}));

const mockAdminCreateUser = jest.fn();
const mockAdminAddUserToGroup = jest.fn();
const mockAdminDeleteUser = jest.fn();
const mockAdminUpdateUserAttributes = jest.fn();
const mockAdminResetUserPassword = jest.fn();
const mockAdminSetUserPassword = jest.fn();

jest.mock('aws-sdk', () => ({
    CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
        adminCreateUser: mockAdminCreateUser,
        adminAddUserToGroup: mockAdminAddUserToGroup,
        adminDeleteUser: mockAdminDeleteUser,
        adminUpdateUserAttributes: mockAdminUpdateUserAttributes,
        adminResetUserPassword: mockAdminResetUserPassword,
        adminSetUserPassword: mockAdminSetUserPassword,
    })),
}));

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
        mockAdminCreateUser.mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                User: { Username: 'uuid-abc' },
            }),
        });
        mockAdminAddUserToGroup.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
        mockAdminDeleteUser.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
        mockAdminUpdateUserAttributes.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
        mockAdminResetUserPassword.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
        mockAdminSetUserPassword.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    });

    it('createCognitoUser creates user and adds member group', async () => {
        const uuid = await createCognitoUser('a@b.com', false, 'tenant-1');
        expect(uuid).toBe('uuid-abc');
        expect(mockAdminCreateUser).toHaveBeenCalled();
        expect(mockAdminAddUserToGroup).toHaveBeenCalledWith(
            expect.objectContaining({ GroupName: 'member', Username: 'uuid-abc' }),
        );
        expect(mockAdminAddUserToGroup).toHaveBeenCalledTimes(1);
    });

    it('createCognitoUser adds membershipAdmin group when requested', async () => {
        await createCognitoUser('c@d.com', true, 'tenant-1');
        expect(mockAdminAddUserToGroup).toHaveBeenCalledTimes(2);
        expect(mockAdminAddUserToGroup).toHaveBeenCalledWith(
            expect.objectContaining({ GroupName: 'membershipAdmin' }),
        );
    });

    it('createCognitoUser throws when addUserToGroup fails', async () => {
        mockAdminAddUserToGroup.mockReturnValue({
            promise: jest.fn().mockRejectedValue(new Error('group err')),
        });
        await expect(createCognitoUser('e@f.com', false, 't')).rejects.toThrow('group err');
    });

    it('deleteCognitoUser calls adminDeleteUser', async () => {
        await deleteCognitoUser('uuid-x');
        expect(mockAdminDeleteUser).toHaveBeenCalledWith(
            expect.objectContaining({ UserPoolId: 'pool-1', Username: 'uuid-x' }),
        );
    });

    it('updateCognitoUserEmail calls adminUpdateUserAttributes', async () => {
        await updateCognitoUserEmail({
            uuid: 'u1',
            email: 'new@x.com',
        } as any);
        expect(mockAdminUpdateUserAttributes).toHaveBeenCalled();
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
        expect(mockAdminSetUserPassword).toHaveBeenCalled();
        expect(mockAdminResetUserPassword).not.toHaveBeenCalled();
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
        expect(mockAdminResetUserPassword).toHaveBeenCalled();
        expect(mockAdminSetUserPassword).not.toHaveBeenCalled();
        expect(mockedSendPwReset).toHaveBeenCalledWith(member, '', 't1');
    });
});
