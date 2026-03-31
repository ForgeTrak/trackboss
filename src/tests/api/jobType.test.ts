import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    getJobType,
    getJobTypeList,
    getJobTypesEventList,
    insertJobType,
    patchJobType,
} from '../../database/jobType';
import jobType from '../../api/jobType';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/jobType');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedList = getJobTypeList as jest.MockedFunction<typeof getJobTypeList>;
const mockedByEvent = getJobTypesEventList as jest.MockedFunction<typeof getJobTypesEventList>;
const mockedGet = getJobType as jest.MockedFunction<typeof getJobType>;
const mockedInsert = insertJobType as jest.MockedFunction<typeof insertJobType>;
const mockedPatch = patchJobType as jest.MockedFunction<typeof patchJobType>;

function okHeader() {
    mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
}

describe('api/jobType', () => {
    const app = createJsonRouterApp('/jt', jobType);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /list', () => {
        it('returns 401 on /list without auth', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/jt/list');
            expect(res.status).toBe(401);
        });

        it('returns job types for /list', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedList.mockResolvedValue([] as any);
            const res = await request(app).get('/jt/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
        });

        it('returns 401 when verify fails on /list', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/jt/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 500 on list error', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedList.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/jt/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('GET /list/:eventTypeName', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'bad', token: '' });
            const res = await request(app).get('/jt/list/X');
            expect(res.status).toBe(401);
            expect(res.body.reason).toBe('bad');
        });

        it('returns list scoped by event type name', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedByEvent.mockResolvedValue([] as any);
            const res = await request(app).get('/jt/list/Work%20Day').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(mockedByEvent).toHaveBeenCalledWith('tenant-test', 'Work Day');
        });

        it('returns 401 when verify fails', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/jt/list/X').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 500 when scoped list fails', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedByEvent.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/jt/list/X').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('POST /new', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).post('/jt/new').send({});
            expect(res.status).toBe(401);
        });

        it('creates job type as Admin', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedInsert.mockResolvedValue(7);
            mockedGet.mockResolvedValue({ jobTypeId: 7 } as any);
            const res = await request(app).post('/jt/new').set('Authorization', 'Bearer t').send({ title: 'T' });
            expect(res.status).toBe(201);
        });

        it('maps verify errors on post', async () => {
            okHeader();
            mockedVerify.mockRejectedValueOnce(new Error('Authorization Failed'));
            let res = await request(app).post('/jt/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(401);
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockRejectedValueOnce(new Error('Forbidden'));
            res = await request(app).post('/jt/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(403);
        });

        it('maps insert errors on post', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedInsert.mockRejectedValueOnce(new Error('user input error'));
            let res = await request(app).post('/jt/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(400);
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedInsert.mockRejectedValueOnce(new Error('db'));
            res = await request(app).post('/jt/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(500);
        });
    });

    describe('GET /:jobTypeID', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/jt/1');
            expect(res.status).toBe(401);
        });

        it('returns one job type', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockResolvedValue({ jobTypeId: 1 } as any);
            const res = await request(app).get('/jt/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
        });

        it('returns 404 when not found', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockRejectedValue(new Error('not found'));
            const res = await request(app).get('/jt/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 401 when verify fails', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/jt/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 500 on other errors', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/jt/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('PATCH /:jobTypeID', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).patch('/jt/1').send({});
            expect(res.status).toBe(401);
        });

        it('returns 200 after patch', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockResolvedValue({ jobTypeId: 2 } as any);
            mockedPatch.mockResolvedValue(undefined as any);
            const res = await request(app).patch('/jt/2').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(200);
        });

        it('maps patch errors', async () => {
            const cases: [string, number][] = [
                ['user input error', 400],
                ['Authorization Failed', 401],
                ['Forbidden', 403],
                ['not found', 404],
                ['other', 500],
            ];
            for (const [msg, status] of cases) {
                jest.clearAllMocks();
                okHeader();
                mockedVerify.mockResolvedValue({} as any);
                mockedGet.mockResolvedValueOnce({ jobTypeId: 2 } as any);
                mockedPatch.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).patch('/jt/2').set('Authorization', 'Bearer t').send({});
                expect(res.status).toBe(status);
            }
        });
    });
});
