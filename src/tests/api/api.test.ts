import express, { Express } from 'express';
import request from 'supertest';

jest.mock('../../api/bike', () => require('express').Router());
jest.mock('../../api/billing', () => require('express').Router());
jest.mock('../../api/boardMember', () => require('express').Router());
jest.mock('../../api/boardMemberType', () => require('express').Router());
jest.mock('../../api/event', () => require('express').Router());
jest.mock('../../api/eventJob', () => require('express').Router());
jest.mock('../../api/eventType', () => require('express').Router());
jest.mock('../../api/job', () => require('express').Router());
jest.mock('../../api/jobType', () => require('express').Router());
jest.mock('../../api/member', () => require('express').Router());
jest.mock('../../api/membership', () => require('express').Router());
jest.mock('../../api/memberType', () => require('express').Router());
jest.mock('../../api/workPoints', () => require('express').Router());
jest.mock('../../api/health', () => require('express').Router());
jest.mock('../../api/gateCode', () => require('express').Router());
jest.mock('../../api/membershipApplication', () => require('express').Router());
jest.mock('../../api/ridingAreaStatus', () => require('express').Router());
jest.mock('../../api/memberCommunication', () => require('express').Router());
jest.mock('../../api/membershipTags', () => require('express').Router());
jest.mock('../../api/link', () => require('express').Router());
jest.mock('../../api/paidLabor', () => require('express').Router());
jest.mock('../../api/defaultSetting', () => require('express').Router());
jest.mock('../../api/auditLog', () => require('express').Router());

jest.mock('../../database/member');
jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));

import api from '../../api/api';
import { getMember } from '../../database/member';
import { checkHeader, verify } from '../../util/auth';
import logger from '../../logger';

const mockedGetMember = getMember as jest.MockedFunction<typeof getMember>;
const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedLoggerInfo = logger.info as jest.Mock;

function createApp(): Express {
    const app = express();
    app.use('/api', api);
    return app;
}

describe('api/api router — GET /me', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 when the authorization header is invalid', async () => {
        mockedCheckHeader.mockReturnValue({
            valid: false,
            reason: 'Missing authorization grant in header',
            token: '',
        });

        const res = await request(createApp()).get('/api/me');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ reason: 'Missing authorization grant in header' });
        expect(mockedVerify).not.toHaveBeenCalled();
    });

    it('returns 401 when token verification fails', async () => {
        mockedCheckHeader.mockReturnValue({
            valid: true,
            reason: '',
            token: 'some.jwt.token',
        });
        mockedVerify.mockRejectedValue(new Error('bad sig'));

        const res = await request(createApp()).get('/api/me').set('Authorization', 'Bearer some.jwt.token');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ reason: 'Invalid token' });
        expect(mockedVerify).toHaveBeenCalledWith('some.jwt.token');
    });

    it('returns 404 when the member is not found', async () => {
        mockedCheckHeader.mockReturnValue({
            valid: true,
            reason: '',
            token: 'some.jwt.token',
        });
        mockedVerify.mockResolvedValue({
            'cognito:username': 'user-uuid',
            active_tenant_id: 'tenant-1',
        } as any);
        mockedGetMember.mockRejectedValue(Object.assign(new Error('not found'), { message: 'not found' }));

        const res = await request(createApp()).get('/api/me').set('Authorization', 'Bearer some.jwt.token');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ reason: 'not found' });
        expect(mockedGetMember).toHaveBeenCalledWith('user-uuid', 'tenant-1');
    });

    it('returns 500 when getMember fails for a non-not-found error', async () => {
        mockedCheckHeader.mockReturnValue({
            valid: true,
            reason: '',
            token: 'some.jwt.token',
        });
        mockedVerify.mockResolvedValue({
            'cognito:username': 'user-uuid',
            active_tenant_id: 'tenant-1',
        } as any);
        mockedGetMember.mockRejectedValue(new Error('database exploded'));

        const res = await request(createApp()).get('/api/me').set('Authorization', 'Bearer some.jwt.token');

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ reason: 'internal server error' });
    });

    it('returns 200 and the member payload when login succeeds', async () => {
        const memberPayload = {
            email: 'member@example.com',
            memberId: 42,
            uuid: 'user-uuid',
        };
        mockedCheckHeader.mockReturnValue({
            valid: true,
            reason: '',
            token: 'some.jwt.token',
        });
        mockedVerify.mockResolvedValue({
            'cognito:username': 'user-uuid',
            active_tenant_id: 'tenant-1',
        } as any);
        mockedGetMember.mockResolvedValue(memberPayload as any);

        const res = await request(createApp()).get('/api/me').set('Authorization', 'Bearer some.jwt.token');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(memberPayload);
        expect(mockedLoggerInfo).toHaveBeenCalledWith(
            expect.stringContaining('Login successful for member@example.com'),
        );
    });
});
