import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import { deleteBike, getBike, getBikeList, insertBike, patchBike } from '../../database/bike';
import bike from '../../api/bike';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/bike');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGetBikeList = getBikeList as jest.MockedFunction<typeof getBikeList>;
const mockedGetBike = getBike as jest.MockedFunction<typeof getBike>;
const mockedInsertBike = insertBike as jest.MockedFunction<typeof insertBike>;
const mockedPatchBike = patchBike as jest.MockedFunction<typeof patchBike>;
const mockedDeleteBike = deleteBike as jest.MockedFunction<typeof deleteBike>;

function validHeader() {
    mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
}

describe('api/bike', () => {
    const app = createJsonRouterApp('/bike', bike);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /new', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).post('/bike/new').send({});
            expect(res.status).toBe(401);
        });

        it('returns 201 and created bike', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedInsertBike.mockResolvedValue(9);
            mockedGetBike.mockResolvedValue({ bikeId: 9 } as any);
            const res = await request(app).post('/bike/new').set('Authorization', 'Bearer t').send({ make: 'Yamaha' });
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ bikeId: 9 });
            expect(mockedInsertBike).toHaveBeenCalled();
        });

        it('returns 400 on user input error', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedInsertBike.mockRejectedValue(new Error('user input error'));
            const res = await request(app).post('/bike/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ reason: 'bad request' });
        });

        it('returns 401 when verify fails as Membership Admin', async () => {
            validHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).post('/bike/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ reason: 'not authorized' });
        });

        it('returns 403 on Forbidden', async () => {
            validHeader();
            mockedVerify.mockRejectedValue(new Error('Forbidden'));
            const res = await request(app).post('/bike/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(403);
        });

        it('returns 500 on unexpected errors', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedInsertBike.mockRejectedValue(new Error('db'));
            const res = await request(app).post('/bike/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(500);
        });
    });

    describe('GET /list', () => {
        it('returns 401 on /list when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/bike/list');
            expect(res.status).toBe(401);
        });

        it('returns bike list when authorized', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetBikeList.mockResolvedValue([] as any);
            const res = await request(app).get('/bike/list?membershipID=1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(mockedGetBikeList).toHaveBeenCalledWith(1, 'tenant-test');
        });

        it('returns 401 when verify fails', async () => {
            validHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/bike/list?membershipID=1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 400 on user input error from list', async () => {
            validHeader();
            mockedVerify.mockRejectedValue(new Error('user input error'));
            const res = await request(app).get('/bike/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(400);
        });

        it('returns 500 on unexpected list error', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetBikeList.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/bike/list?membershipID=1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('GET /:bikeID', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'missing', token: '' });
            const res = await request(app).get('/bike/5');
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ reason: 'missing' });
        });

        it('returns a single bike by id', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedGetBike.mockResolvedValue({ bikeId: 5 } as any);
            const res = await request(app).get('/bike/5').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ bikeId: 5 });
        });

        it('returns 404 when bike not found', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedGetBike.mockRejectedValue(new Error('not found'));
            const res = await request(app).get('/bike/99').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 401 when verify fails', async () => {
            validHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/bike/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 500 on unexpected error', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedGetBike.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/bike/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('PATCH /:bikeID', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).patch('/bike/1').send({});
            expect(res.status).toBe(401);
        });

        it('returns 404 when bike id is not a number', async () => {
            validHeader();
            const res = await request(app).patch('/bike/not-a-number').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(404);
        });

        it('returns 200 after patch', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedGetBike.mockResolvedValue({ bikeId: 2 } as any);
            mockedPatchBike.mockResolvedValue(undefined as any);
            const res = await request(app).patch('/bike/2').set('Authorization', 'Bearer t').send({ make: 'Honda' });
            expect(res.status).toBe(200);
            expect(mockedPatchBike).toHaveBeenCalled();
        });

        it('maps patch error messages to status codes', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedGetBike.mockResolvedValue({ bikeId: 2 } as any);
            const cases: [string, number][] = [
                ['user input error', 400],
                ['not found', 404],
                ['Authorization Failed', 401],
                ['Forbidden', 403],
                ['other', 500],
            ];
            for (const [msg, status] of cases) {
                jest.clearAllMocks();
                validHeader();
                mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
                mockedGetBike.mockResolvedValueOnce({ bikeId: 2 } as any);
                mockedPatchBike.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).patch('/bike/2').set('Authorization', 'Bearer t').send({});
                expect(res.status).toBe(status);
            }
        });
    });

    describe('DELETE /:bikeID', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).delete('/bike/1');
            expect(res.status).toBe(401);
        });

        it('returns 404 when id is NaN', async () => {
            validHeader();
            const res = await request(app).delete('/bike/bad').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 200 and bikeId after delete', async () => {
            validHeader();
            mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
            mockedGetBike.mockResolvedValue({ bikeId: 3 } as any);
            mockedDeleteBike.mockResolvedValue(undefined as any);
            const res = await request(app).delete('/bike/3').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ bikeId: 3 });
        });

        it('maps delete errors to statuses', async () => {
            const cases: [string, number][] = [
                ['not found', 404],
                ['Authorization Failed', 401],
                ['Forbidden', 403],
                ['other', 500],
            ];
            for (const [msg, status] of cases) {
                jest.clearAllMocks();
                validHeader();
                mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
                mockedGetBike.mockResolvedValueOnce({ bikeId: 4 } as any);
                mockedDeleteBike.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).delete('/bike/4').set('Authorization', 'Bearer t');
                expect(res.status).toBe(status);
            }
        });
    });
});
