import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import { flipRidingAreaStatus, getRidingAreaStatuses } from '../../database/ridingAreaStatus';
import ridingAreaStatus from '../../api/ridingAreaStatus';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/ridingAreaStatus');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGetStatuses = getRidingAreaStatuses as jest.MockedFunction<typeof getRidingAreaStatuses>;
const mockedFlip = flipRidingAreaStatus as jest.MockedFunction<typeof flipRidingAreaStatus>;

describe('api/ridingAreaStatus', () => {
    const app = createJsonRouterApp('/ras', ridingAreaStatus);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 when header invalid on GET /', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'nope', token: '' });
        const res = await request(app).get('/ras/');
        expect(res.status).toBe(401);
    });

    it('returns statuses when verify succeeds', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetStatuses.mockResolvedValue([{ id: 1, open: true }] as any);
        const res = await request(app).get('/ras/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetStatuses).toHaveBeenCalledWith('tenant-test');
    });

    it('PATCH /:id calls flip after admin verify', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetStatuses.mockResolvedValue([]);
        mockedFlip.mockResolvedValue({ updated: true } as any);
        const res = await request(app)
            .patch('/ras/3')
            .set('Authorization', 'Bearer t')
            .send({ area: 'north' });
        expect(res.status).toBe(200);
        expect(mockedFlip).toHaveBeenCalledWith(3, { area: 'north' }, 'tenant-test');
    });

    it('returns 401 on GET when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/ras/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ reason: 'not authorized' });
    });

    it('returns 404 on GET when statuses throw not found', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetStatuses.mockRejectedValue(new Error('not found'));
        const res = await request(app).get('/ras/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ reason: 'not found' });
    });

    it('returns 500 on GET when statuses throw unexpectedly', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetStatuses.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/ras/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ reason: 'internal server error' });
    });

    it('returns 500 on PATCH when validateAdminAccess fails (e.g. missing header)', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'Missing authorization grant in header', token: '' });
        const res = await request(app).patch('/ras/1').send({});
        expect(res.status).toBe(500);
        expect(res.text).toContain('Unable to process');
    });

    it('returns 500 on PATCH when verify fails as Admin (logs and rethrows)', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).patch('/ras/1').set('Authorization', 'Bearer t').send({ area: 'x' });
        expect(res.status).toBe(500);
        expect(res.text).toContain('Unable to process');
    });
});
