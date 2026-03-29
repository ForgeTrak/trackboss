import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    deleteEventJob,
    getEventJob,
    insertEventJob,
    patchEventJob,
} from '../../database/eventJob';
import eventJob from '../../api/eventJob';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/eventJob');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGet = getEventJob as jest.MockedFunction<typeof getEventJob>;
const mockedInsert = insertEventJob as jest.MockedFunction<typeof insertEventJob>;
const mockedPatch = patchEventJob as jest.MockedFunction<typeof patchEventJob>;
const mockedDelete = deleteEventJob as jest.MockedFunction<typeof deleteEventJob>;

function okHeader() {
    mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
}

describe('api/eventJob', () => {
    const app = createJsonRouterApp('/ej', eventJob);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /new', () => {
        it('returns 401 without valid header', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).post('/ej/new').send({});
            expect(res.status).toBe(401);
        });

        it('returns 201 when Admin creates event job', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedInsert.mockResolvedValue(9);
            mockedGet.mockResolvedValue({ eventJobId: 9 } as any);
            const res = await request(app).post('/ej/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(201);
        });

        it('maps insert errors to 400 and 500', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedInsert.mockRejectedValueOnce(new Error('user input error'));
            let res = await request(app).post('/ej/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(400);
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedInsert.mockRejectedValueOnce(new Error('db'));
            res = await request(app).post('/ej/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(500);
        });

        it('maps verify errors on post to 401 and 403', async () => {
            okHeader();
            mockedVerify.mockRejectedValueOnce(new Error('Authorization Failed'));
            let res = await request(app).post('/ej/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(401);
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockRejectedValueOnce(new Error('Forbidden'));
            res = await request(app).post('/ej/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(403);
        });
    });

    describe('GET /:eventJobID', () => {
        it('returns 401 without auth', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/ej/1');
            expect(res.status).toBe(401);
        });

        it('returns one event job', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockResolvedValue({ eventJobId: 1 } as any);
            const res = await request(app).get('/ej/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(mockedGet).toHaveBeenCalledWith(1, 'tenant-test');
        });

        it('returns 401 when verify fails', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/ej/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 404 when not found', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockRejectedValue(new Error('not found'));
            const res = await request(app).get('/ej/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 500 on other errors', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/ej/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('PATCH /:eventJobID', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).patch('/ej/1').send({});
            expect(res.status).toBe(401);
        });

        it('returns 404 when id is NaN', async () => {
            okHeader();
            const res = await request(app).patch('/ej/bad').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(404);
        });

        it('returns 200 after patch', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockResolvedValue({ eventJobId: 2 } as any);
            mockedPatch.mockResolvedValue(undefined as any);
            const res = await request(app).patch('/ej/2').set('Authorization', 'Bearer t').send({ x: 1 });
            expect(res.status).toBe(200);
        });

        it('maps patch errors', async () => {
            const cases: [string, number][] = [
                ['user input error', 400],
                ['not found', 404],
                ['Authorization Failed', 401],
                ['Forbidden', 403],
                ['other', 500],
            ];
            for (const [msg, status] of cases) {
                jest.clearAllMocks();
                okHeader();
                mockedVerify.mockResolvedValue({} as any);
                mockedGet.mockResolvedValueOnce({ eventJobId: 2 } as any);
                mockedPatch.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).patch('/ej/2').set('Authorization', 'Bearer t').send({});
                expect(res.status).toBe(status);
            }
        });
    });

    describe('DELETE /:eventJobID', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).delete('/ej/1');
            expect(res.status).toBe(401);
        });

        it('returns 404 when id is NaN', async () => {
            okHeader();
            const res = await request(app).delete('/ej/bad').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 200 after delete', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockResolvedValue({ eventJobId: 3 } as any);
            mockedDelete.mockResolvedValue(undefined as any);
            const res = await request(app).delete('/ej/3').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ eventJobId: 3 });
        });

        it('maps delete errors', async () => {
            const cases: [string, number][] = [
                ['not found', 404],
                ['Authorization Failed', 401],
                ['Forbidden', 403],
                ['other', 500],
            ];
            for (const [msg, status] of cases) {
                jest.clearAllMocks();
                okHeader();
                mockedVerify.mockResolvedValue({} as any);
                mockedGet.mockResolvedValueOnce({ eventJobId: 4 } as any);
                mockedDelete.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).delete('/ej/4').set('Authorization', 'Bearer t');
                expect(res.status).toBe(status);
            }
        });
    });
});
