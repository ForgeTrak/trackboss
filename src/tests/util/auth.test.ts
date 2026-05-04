jest.mock('../../util/environmentWrapper', () => ({
    getCognitoPoolId: jest.fn().mockResolvedValue('pool-id'),
    getCognitoClientId: jest.fn().mockResolvedValue('client-a,client-b'),
}));

const mockJwtVerify = jest.fn();

jest.mock('aws-jwt-verify', () => ({
    CognitoJwtVerifier: {
        create: jest.fn(() => ({
            verify: (...args: unknown[]) => mockJwtVerify(...args),
            hydrate: jest.fn().mockResolvedValue(undefined),
        })),
    },
}));

jest.mock('../../database/member', () => ({
    getMember: jest.fn(),
    getValidActors: jest.fn(),
}));

import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { getMember, getValidActors } from '../../database/member';
import { getCognitoClientId, getCognitoPoolId } from '../../util/environmentWrapper';
import type { Request, Response } from 'express';
import { checkHeader, createVerifier, validateAdminAccess, verify } from '../../util/auth';

const mockedGetMember = getMember as jest.MockedFunction<typeof getMember>;
const mockedGetValidActors = getValidActors as jest.MockedFunction<typeof getValidActors>;
const mockedPool = getCognitoPoolId as jest.MockedFunction<typeof getCognitoPoolId>;
const mockedClient = getCognitoClientId as jest.MockedFunction<typeof getCognitoClientId>;

describe('util/auth checkHeader', () => {
    it('rejects missing header', () => {
        expect(checkHeader(undefined)).toEqual({
            valid: false,
            reason: 'Missing authorization grant in header',
            token: '',
        });
    });

    it('rejects wrong number of parts', () => {
        expect(checkHeader('Bearer')).toMatchObject({ valid: false });
        expect(checkHeader('a b c')).toMatchObject({ valid: false });
    });

    it('rejects non-Bearer type', () => {
        expect(checkHeader('Basic xxx')).toMatchObject({
            valid: false,
            reason: 'Incorrect token type in authorization grant',
        });
    });

    it('accepts Bearer token', () => {
        expect(checkHeader('Bearer my.jwt.token')).toEqual({
            valid: true,
            reason: '',
            token: 'my.jwt.token',
        });
    });
});

describe('util/auth createVerifier', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedPool.mockResolvedValue('pool-id');
        mockedClient.mockResolvedValue('client-a,client-b');
    });

    it('throws when pool id missing', async () => {
        mockedPool.mockResolvedValueOnce(undefined as any);
        await expect(createVerifier()).rejects.toThrow('missing pool ID');
    });

    it('throws when client id missing', async () => {
        mockedClient.mockResolvedValueOnce(undefined as any);
        await expect(createVerifier()).rejects.toThrow('missing client ID');
    });

    it('creates verifier with split client ids', async () => {
        await createVerifier();
        expect(CognitoJwtVerifier.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userPoolId: 'pool-id',
                clientId: ['client-a', 'client-b'],
            }),
        );
    });
});

describe('util/auth verify', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedPool.mockResolvedValue('pool-id');
        mockedClient.mockResolvedValue('cid');
        mockJwtVerify.mockResolvedValue({
            active_tenant_id: 'tenant-1',
            'cognito:username': 'cog-user',
        });
        mockedGetMember.mockResolvedValue({
            memberId: 10,
            memberType: 'Admin',
            isBoardMember: false,
        } as any);
        mockedGetValidActors.mockResolvedValue([10, 11] as any);
    });

    it('returns payload after JWT verify without permission', async () => {
        const p = await verify('tok');
        expect(p.active_tenant_id).toBe('tenant-1');
        expect(mockJwtVerify).toHaveBeenCalledWith('tok');
    });

    it('allows Admin when member is Admin', async () => {
        mockedGetMember.mockResolvedValueOnce({ memberId: 1, memberType: 'Admin', isBoardMember: false } as any);
        await expect(verify('t', 'Admin')).resolves.toMatchObject({ memberId: 1 });
    });

    it('allows Admin when board member', async () => {
        mockedGetMember.mockResolvedValueOnce({
            memberId: 2,
            memberType: 'Full Member',
            isBoardMember: true,
        } as any);
        await expect(verify('t', 'Admin')).resolves.toMatchObject({ memberId: 2 });
    });

    it('rejects Admin for non-admin non-board', async () => {
        mockedGetMember.mockResolvedValueOnce({
            memberId: 3,
            memberType: 'Full Member',
            isBoardMember: false,
        } as any);
        await expect(verify('t', 'Admin')).rejects.toThrow('Authorization Failed');
    });

    it('Membership Admin non-Admin without role throws Forbidden', async () => {
        mockedGetMember.mockResolvedValueOnce({
            memberId: 4,
            memberType: 'Full Member',
            firstName: 'A',
            lastName: 'B',
        } as any);
        await expect(verify('t', 'Membership Admin', 9)).rejects.toThrow('Forbidden');
    });

    it('Membership Admin may act when membership admin matches', async () => {
        mockedGetMember
            .mockResolvedValueOnce({
                memberId: 50,
                memberType: 'Membership Admin',
                firstName: 'M',
                lastName: 'A',
            } as any)
            .mockResolvedValueOnce({
                membershipAdminId: 50,
                firstName: 'X',
                lastName: 'Y',
            } as any);
        await expect(verify('t', 'Membership Admin', 99)).resolves.toBeDefined();
    });

    it('Membership Admin cannot act when target membership belongs to another admin', async () => {
        mockedGetMember
            .mockResolvedValueOnce({
                memberId: 50,
                memberType: 'Membership Admin',
                firstName: 'M',
                lastName: 'A',
            } as any)
            .mockResolvedValueOnce({
                membershipAdminId: 99,
                firstName: 'X',
                lastName: 'Y',
            } as any);
        await expect(verify('t', 'Membership Admin', 88)).rejects.toThrow('Authorization Failed');
    });

    it('Member permission rejects Paid Laborer', async () => {
        mockedGetMember.mockResolvedValueOnce({
            memberId: 6,
            memberType: 'Paid Laborer',
        } as any);
        await expect(verify('t', 'Member', 6)).rejects.toThrow('Forbidden');
    });

    it('Member permission checks validActors for non-Admin', async () => {
        mockedGetMember.mockResolvedValueOnce({
            memberId: 7,
            memberType: 'Full Member',
        } as any);
        mockedGetValidActors.mockResolvedValueOnce([99] as any);
        await expect(verify('t', 'Member', 10)).rejects.toThrow('Forbidden');
    });

    it('Member permission allows when actor in list', async () => {
        mockedGetMember.mockResolvedValueOnce({
            memberId: 7,
            memberType: 'Full Member',
        } as any);
        mockedGetValidActors.mockResolvedValueOnce([7] as any);
        await expect(verify('t', 'Member', 10)).resolves.toBeDefined();
    });

    it('rethrows Forbidden from inner checks', async () => {
        mockedGetMember.mockResolvedValueOnce({
            memberId: 4,
            memberType: 'Full Member',
            firstName: 'A',
            lastName: 'B',
        } as any);
        await expect(verify('t', 'Membership Admin')).rejects.toThrow('Forbidden');
    });

    it('maps other errors to Authorization Failed', async () => {
        mockJwtVerify.mockRejectedValueOnce(new Error('bad sig'));
        await expect(verify('t')).rejects.toThrow('Authorization Failed');
    });
});

describe('util/auth validateAdminAccess', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedPool.mockResolvedValue('pool-id');
        mockedClient.mockResolvedValue('cid');
        mockJwtVerify.mockResolvedValue({
            active_tenant_id: 'tenant-1',
            'cognito:username': 'cog-user',
        });
        mockedGetMember.mockResolvedValue({
            memberId: 1,
            memberType: 'Admin',
            isBoardMember: false,
        } as any);
    });

    it('returns token payload when header valid and user is Admin', async () => {
        const req = { headers: { authorization: 'Bearer tok' } } as unknown as Request;
        const res = {} as Response;
        const token = await validateAdminAccess(req, res);
        expect(token).toMatchObject({ active_tenant_id: 'tenant-1' });
    });

    it('throws when header invalid', async () => {
        const req = { headers: { authorization: 'Bad' } } as unknown as Request;
        const res = {} as Response;
        await expect(validateAdminAccess(req, res)).rejects.toThrow();
    });

    it('rethrows verify failures', async () => {
        mockJwtVerify.mockRejectedValueOnce(new Error('Authorization Failed'));
        const req = { headers: { authorization: 'Bearer t' } } as unknown as Request;
        const res = {} as Response;
        await expect(validateAdminAccess(req, res)).rejects.toThrow('Authorization Failed');
    });
});
