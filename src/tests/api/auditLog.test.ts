import express, { Express } from 'express';
import request from 'supertest';

jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));
jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));

import auditLog from '../../api/auditLog';
import { getAuditLogById, getAuditLogByTenant } from '../../database/auditLog';
import { validateAdminAccess } from '../../util/auth';

const mockedGetAuditLogById = getAuditLogById as jest.MockedFunction<typeof getAuditLogById>;
const mockedGetAuditLogByTenant = getAuditLogByTenant as jest.MockedFunction<typeof getAuditLogByTenant>;
const mockedValidateAdminAccess = validateAdminAccess as jest.MockedFunction<typeof validateAdminAccess>;

/** Mirrors server.ts: routes that use validateAdminAccess still expect req.user from prior middleware. */
function createApp(): Express {
    const app = express();
    app.use((req: any, _res, next) => {
        req.user = {
            tenantId: 'tenant-test',
            uuid: 'user-test',
            email: 'admin@example.com',
        };
        next();
    });
    app.use('/auditLog', auditLog);
    return app;
}

describe('api/auditLog router', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedValidateAdminAccess.mockResolvedValue({} as any);
    });

    describe('GET /auditLog (all logs for tenant)', () => {
        it('returns audit rows when admin access succeeds', async () => {
            const rows = [{ id: 1, action: 'update' }];
            mockedGetAuditLogByTenant.mockResolvedValue(rows as any);

            const res = await request(createApp())
                .get('/auditLog')
                .set('Authorization', 'Bearer fake.admin.token');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(rows);
            expect(mockedValidateAdminAccess).toHaveBeenCalled();
            expect(mockedGetAuditLogByTenant).toHaveBeenCalledWith('tenant-test');
        });

        it('returns 401 when validateAdminAccess fails with Authorization Failed', async () => {
            mockedValidateAdminAccess.mockRejectedValue(
                Object.assign(new Error('Authorization Failed'), { message: 'Authorization Failed' }),
            );

            const res = await request(createApp())
                .get('/auditLog')
                .set('Authorization', 'Bearer fake.admin.token');

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ reason: 'not authorized' });
            expect(mockedGetAuditLogByTenant).not.toHaveBeenCalled();
        });

        it('returns 500 when the database call fails', async () => {
            mockedGetAuditLogByTenant.mockRejectedValue(new Error('db error'));

            const res = await request(createApp())
                .get('/auditLog')
                .set('Authorization', 'Bearer fake.admin.token');

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ reason: 'internal server error' });
        });
    });

    describe('GET /auditLog/:entityType/:entityId', () => {
        it('returns logs for the entity when admin access succeeds', async () => {
            const rows = [{ id: 2, entityId: '5' }];
            mockedGetAuditLogById.mockResolvedValue(rows as any);

            const res = await request(createApp())
                .get('/auditLog/member/5')
                .set('Authorization', 'Bearer fake.admin.token');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(rows);
            expect(mockedGetAuditLogById).toHaveBeenCalledWith('tenant-test', 'member', '5');
        });

        it('returns 401 when admin validation fails', async () => {
            mockedValidateAdminAccess.mockRejectedValue(
                Object.assign(new Error('Authorization Failed'), { message: 'Authorization Failed' }),
            );

            const res = await request(createApp())
                .get('/auditLog/member/5')
                .set('Authorization', 'Bearer fake.admin.token');

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ reason: 'not authorized' });
        });

        it('returns 500 when getAuditLogById fails with a non-auth error', async () => {
            mockedGetAuditLogById.mockRejectedValue(new Error('db error'));

            const res = await request(createApp())
                .get('/auditLog/member/5')
                .set('Authorization', 'Bearer fake.admin.token');

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ reason: 'internal server error' });
        });
    });
});
