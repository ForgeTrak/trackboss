import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    createPaidLabor,
    deletePaidLaborById,
    getPaidLabor,
    getPaidLaborById,
    updatePaidLabor,
} from '../../database/paidLabor';
import paidLabor from '../../api/paidLabor';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/paidLabor');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGetPaidLabor = getPaidLabor as jest.MockedFunction<typeof getPaidLabor>;
const mockedGetById = getPaidLaborById as jest.MockedFunction<typeof getPaidLaborById>;
const mockedCreate = createPaidLabor as jest.MockedFunction<typeof createPaidLabor>;
const mockedUpdate = updatePaidLabor as jest.MockedFunction<typeof updatePaidLabor>;
const mockedDelete = deletePaidLaborById as jest.MockedFunction<typeof deletePaidLaborById>;

function okHeader() {
    mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
}

describe('api/paidLabor', () => {
    const app = createJsonRouterApp('/pl', paidLabor);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /list', () => {
        it('returns 401 on /list without auth', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/pl/list');
            expect(res.status).toBe(401);
        });

        it('returns paid labor list', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetPaidLabor.mockResolvedValue([] as any);
            const res = await request(app).get('/pl/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(mockedGetPaidLabor).toHaveBeenCalledWith('tenant-test');
        });

        it('returns 401 when verify fails', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/pl/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 500 on list error', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetPaidLabor.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/pl/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('GET /:paidLaborId', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/pl/1');
            expect(res.status).toBe(401);
        });

        it('returns one record (uses memberTypeID param name in route impl)', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetById.mockResolvedValue({ id: 1 } as any);
            const res = await request(app).get('/pl/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
        });

        it('returns 404 when not found', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetById.mockRejectedValue(new Error('not found'));
            const res = await request(app).get('/pl/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 401 when verify fails', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/pl/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 500 on other errors', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetById.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/pl/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('POST /', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).post('/pl/').send({});
            expect(res.status).toBe(401);
        });

        it('creates record as Admin', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedCreate.mockResolvedValue({ id: 1 } as any);
            const res = await request(app).post('/pl/').set('Authorization', 'Bearer t').send({ name: 'x' });
            expect(res.status).toBe(200);
            expect(mockedCreate).toHaveBeenCalledWith({ name: 'x' }, 'tenant-test');
        });

        it('maps post errors', async () => {
            const verifyCases: [string, number][] = [
                ['Authorization Failed', 401],
                ['Forbidden', 403],
            ];
            for (const [msg, status] of verifyCases) {
                jest.clearAllMocks();
                okHeader();
                mockedVerify.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).post('/pl/').set('Authorization', 'Bearer t').send({});
                expect(res.status).toBe(status);
            }
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedCreate.mockRejectedValueOnce(new Error('not found'));
            let res = await request(app).post('/pl/').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(404);
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedCreate.mockRejectedValueOnce(new Error('db'));
            res = await request(app).post('/pl/').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(500);
        });
    });

    describe('PATCH /:paidLaborId', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).patch('/pl/1').send({});
            expect(res.status).toBe(401);
        });

        it('returns 404 when id is NaN', async () => {
            okHeader();
            const res = await request(app).patch('/pl/bad').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(404);
        });

        it('returns 200 after update', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetById.mockResolvedValue({ id: 2 } as any);
            mockedUpdate.mockResolvedValue(undefined as any);
            const res = await request(app).patch('/pl/2').set('Authorization', 'Bearer t').send({ rate: 10 });
            expect(res.status).toBe(200);
        });

        it('maps patch errors', async () => {
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
                mockedGetById.mockResolvedValueOnce({ id: 3 } as any);
                mockedUpdate.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).patch('/pl/3').set('Authorization', 'Bearer t').send({});
                expect(res.status).toBe(status);
            }
        });
    });

    describe('DELETE /:paidLaborId', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).delete('/pl/1');
            expect(res.status).toBe(401);
        });

        it('returns 404 when id is NaN', async () => {
            okHeader();
            const res = await request(app).delete('/pl/bad').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 200 after delete', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetById.mockResolvedValue({ id: 4 } as any);
            mockedDelete.mockResolvedValue(undefined as any);
            const res = await request(app).delete('/pl/4').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
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
                mockedGetById.mockResolvedValueOnce({ id: 5 } as any);
                mockedDelete.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).delete('/pl/5').set('Authorization', 'Bearer t');
                expect(res.status).toBe(status);
            }
        });
    });
});
