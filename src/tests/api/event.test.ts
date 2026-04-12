import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    deleteEvent,
    getClosestEvent,
    getEvent,
    getEventList,
    getRelatedEvents,
    insertEvent,
    patchEvent,
} from '../../database/event';
import event from '../../api/event';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/event');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGetEventList = getEventList as jest.MockedFunction<typeof getEventList>;
const mockedGetEvent = getEvent as jest.MockedFunction<typeof getEvent>;
const mockedInsert = insertEvent as jest.MockedFunction<typeof insertEvent>;
const mockedRelated = getRelatedEvents as jest.MockedFunction<typeof getRelatedEvents>;
const mockedGetClosestEvent = getClosestEvent as jest.MockedFunction<typeof getClosestEvent>;
const mockedPatch = patchEvent as jest.MockedFunction<typeof patchEvent>;
const mockedDelete = deleteEvent as jest.MockedFunction<typeof deleteEvent>;

describe('api/event', () => {
    const app = createJsonRouterApp('/ev', event);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 on /list without auth', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).get('/ev/list');
        expect(res.status).toBe(401);
    });

    it('returns event list without range header', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedGetEventList.mockResolvedValue([] as any);
        const res = await request(app).get('/ev/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetEventList).toHaveBeenCalledWith('tenant-test');
    });

    it('POST /new creates parent and no children when related empty', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedInsert.mockResolvedValue(10);
        mockedGetEvent.mockResolvedValue({ eventId: 10 } as any);
        mockedRelated.mockResolvedValue([] as any);
        const res = await request(app).post('/ev/new').set('Authorization', 'Bearer t').send({ title: 'T' });
        expect(res.status).toBe(201);
        expect(mockedInsert).toHaveBeenCalledWith('tenant-test', { title: 'T' });
    });

    it('POST /new creates child events when related returns templates', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedInsert.mockResolvedValueOnce(20).mockResolvedValueOnce(21);
        mockedGetEvent.mockResolvedValue({ eventId: 20, title: 'Parent' } as any);
        mockedRelated.mockResolvedValue([{ title: 'Child' }] as any);
        const res = await request(app).post('/ev/new').set('Authorization', 'Bearer t').send({ title: 'P' });
        expect(res.status).toBe(201);
        expect(mockedInsert).toHaveBeenCalledTimes(2);
    });

    it('GET /:eventID/next uses getClosestEvent', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedGetClosestEvent.mockResolvedValue({ eventId: 99 } as any);
        const res = await request(app).get('/ev/next').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetClosestEvent).toHaveBeenCalledWith('tenant-test');
    });

    it('GET /list with dateRange returns 206', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedGetEventList.mockResolvedValue([] as any);
        const res = await request(app)
            .get('/ev/list')
            .query({ dateRange: '20260101-20261231' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(206);
    });

    it('GET /list returns 400 for malformed dateRange', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        const res = await request(app)
            .get('/ev/list')
            .query({ dateRange: 'bad' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(400);
    });

    it('GET /list with open-ended start uses end date only', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedGetEventList.mockResolvedValue([] as any);
        const res = await request(app)
            .get('/ev/list')
            .query({ dateRange: '-20261231' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(206);
    });

    it('GET /:eventID returns one event', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedGetEvent.mockResolvedValue({ eventId: 3 } as any);
        const res = await request(app).get('/ev/3').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PATCH /:eventID updates as Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetEvent.mockResolvedValue({ eventId: 4 } as any);
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedPatch.mockResolvedValue(undefined as any);
        const res = await request(app).patch('/ev/4').set('Authorization', 'Bearer t').send({ title: 'U' });
        expect(res.status).toBe(200);
    });

    it('DELETE /:eventID removes as Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetEvent.mockResolvedValue({ eventId: 6 } as any);
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedDelete.mockResolvedValue(undefined as any);
        const res = await request(app).delete('/ev/6').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PATCH returns 404 for non-numeric event id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        const res = await request(app).patch('/ev/bad').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(404);
    });

    it('POST /new returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).post('/ev/new').send({});
        expect(res.status).toBe(401);
    });

    it('POST /new returns 400 when insertEvent throws user input error', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedInsert.mockRejectedValue(new Error('user input error'));
        const res = await request(app).post('/ev/new').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ reason: 'bad request' });
    });

    it('POST /new returns 401 when insertEvent throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedInsert.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).post('/ev/new').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(401);
    });

    it('POST /new returns 403 when insertEvent throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedInsert.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).post('/ev/new').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(403);
    });

    it('POST /new returns 500 on unexpected insert errors', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedInsert.mockRejectedValue(new Error('db'));
        const res = await request(app).post('/ev/new').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(500);
    });

    it('GET /list returns 401 when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/ev/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('GET /list returns 500 when verify throws unexpected error', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('token expired'));
        const res = await request(app).get('/ev/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('GET /list returns 400 when dateRange has no hyphen pair', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        const res = await request(app)
            .get('/ev/list')
            .query({ dateRange: '20260101' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(400);
    });

    it('GET /list returns 400 when dateRange dates are invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        const res = await request(app)
            .get('/ev/list')
            .query({ dateRange: 'abcd0101-20261231' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(400);
    });

    it('GET /list with open-ended end uses start date only', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedGetEventList.mockResolvedValue([] as any);
        const res = await request(app)
            .get('/ev/list')
            .query({ dateRange: '20260101-' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(206);
        expect(mockedGetEventList).toHaveBeenCalledWith('tenant-test', '2026-01-01');
    });

    it('GET /list with both dateRange bounds calls getEventList with start and end', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedGetEventList.mockResolvedValue([] as any);
        const res = await request(app)
            .get('/ev/list')
            .query({ dateRange: '20260101-20260131' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(206);
        expect(mockedGetEventList).toHaveBeenCalledWith('tenant-test', '2026-01-01', '2026-01-31');
    });

    it('GET /:eventID returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'nope', token: '' });
        const res = await request(app).get('/ev/1').set('Authorization', 'Bearer x');
        expect(res.status).toBe(401);
    });

    it('GET /:eventID returns 404 for non-numeric id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        const res = await request(app).get('/ev/notanumber').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('GET /:eventID returns 401 when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/ev/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('GET /:eventID returns 500 when getEvent throws', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedGetEvent.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/ev/5').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('PATCH /:eventID returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).patch('/ev/1').send({});
        expect(res.status).toBe(401);
    });

    it('PATCH /:eventID returns 401 when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetEvent.mockResolvedValue({ eventId: 7 } as any);
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).patch('/ev/7').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(401);
    });

    it('PATCH /:eventID returns 403 when verify throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetEvent.mockResolvedValue({ eventId: 8 } as any);
        mockedVerify.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).patch('/ev/8').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(403);
    });

    it('PATCH /:eventID returns 400 when patchEvent throws user input error', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetEvent.mockResolvedValue({ eventId: 9 } as any);
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedPatch.mockRejectedValue(new Error('user input error'));
        const res = await request(app).patch('/ev/9').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(400);
    });

    it('PATCH /:eventID returns 404 when getEvent throws not found', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetEvent.mockRejectedValue(new Error('not found'));
        const res = await request(app).patch('/ev/9').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(404);
    });

    it('PATCH /:eventID returns 500 on unexpected errors', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetEvent.mockResolvedValue({ eventId: 11 } as any);
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedPatch.mockRejectedValue(new Error('db'));
        const res = await request(app).patch('/ev/11').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(500);
    });

    it('DELETE /:eventID returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).delete('/ev/1');
        expect(res.status).toBe(401);
    });

    it('DELETE /:eventID returns 404 for non-numeric id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        const res = await request(app).delete('/ev/bad').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('DELETE /:eventID returns 401 when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetEvent.mockResolvedValue({ eventId: 12 } as any);
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).delete('/ev/12').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('DELETE /:eventID returns 403 when verify throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetEvent.mockResolvedValue({ eventId: 13 } as any);
        mockedVerify.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).delete('/ev/13').set('Authorization', 'Bearer t');
        expect(res.status).toBe(403);
    });

    it('DELETE /:eventID returns 500 when deleteEvent throws', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetEvent.mockResolvedValue({ eventId: 14 } as any);
        mockedVerify.mockResolvedValue({ active_tenant_id: 'tenant-test' } as any);
        mockedDelete.mockRejectedValue(new Error('db'));
        const res = await request(app).delete('/ev/14').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });
});
