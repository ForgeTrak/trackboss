import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import { getEventType, getEventTypeList, insertEventType, patchEventType } from '../../database/eventType';
import eventType from '../../api/eventType';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/eventType');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedList = getEventTypeList as jest.MockedFunction<typeof getEventTypeList>;
const mockedGet = getEventType as jest.MockedFunction<typeof getEventType>;
const mockedInsert = insertEventType as jest.MockedFunction<typeof insertEventType>;
const mockedPatch = patchEventType as jest.MockedFunction<typeof patchEventType>;

function okHeader() {
    mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
}

describe('api/eventType', () => {
    const app = createJsonRouterApp('/et', eventType);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /list', () => {
        it('returns 401 on /list without auth', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/et/list');
            expect(res.status).toBe(401);
        });

        it('returns event type list', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedList.mockResolvedValue([] as any);
            const res = await request(app).get('/et/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(mockedList).toHaveBeenCalledWith('tenant-test');
        });

        it('returns 401 when verify fails on list', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/et/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 500 on list db error', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedList.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/et/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('POST /new', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'nope', token: '' });
            const res = await request(app).post('/et/new').send({});
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ reason: 'nope' });
        });

        it('POST /new creates as Admin', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedInsert.mockResolvedValue(3);
            mockedGet.mockResolvedValue({ eventTypeId: 3 } as any);
            const res = await request(app).post('/et/new').set('Authorization', 'Bearer t').send({ name: 'Race' });
            expect(res.status).toBe(201);
            expect(mockedInsert).toHaveBeenCalledWith('tenant-test', { name: 'Race' });
        });

        it('maps insert errors to 400 and 500 on post', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedInsert.mockRejectedValueOnce(new Error('user input error'));
            let res = await request(app).post('/et/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(400);
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedInsert.mockRejectedValueOnce(new Error('db'));
            res = await request(app).post('/et/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(500);
        });

        it('maps verify errors on post to 401 and 403', async () => {
            okHeader();
            mockedVerify.mockRejectedValueOnce(new Error('Authorization Failed'));
            let res = await request(app).post('/et/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(401);
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockRejectedValueOnce(new Error('Forbidden'));
            res = await request(app).post('/et/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(403);
        });
    });

    describe('GET /:eventTypeID', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/et/5');
            expect(res.status).toBe(401);
        });

        it('returns one event type', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockResolvedValue({ eventTypeId: 5 } as any);
            const res = await request(app).get('/et/5').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
        });

        it('returns 404 when not found', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockRejectedValue(new Error('not found'));
            const res = await request(app).get('/et/5').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 401 when verify fails', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/et/5').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 500 on other get errors', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/et/5').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('PATCH /:eventTypeID', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).patch('/et/1').send({});
            expect(res.status).toBe(401);
        });

        it('returns 200 after patch', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockResolvedValue({ eventTypeId: 1 } as any);
            mockedPatch.mockResolvedValue(undefined as any);
            const res = await request(app).patch('/et/1').set('Authorization', 'Bearer t').send({ name: 'X' });
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
                mockedGet.mockResolvedValueOnce({ eventTypeId: 1 } as any);
                mockedPatch.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).patch('/et/1').set('Authorization', 'Bearer t').send({});
                expect(res.status).toBe(status);
            }
        });
    });
});
