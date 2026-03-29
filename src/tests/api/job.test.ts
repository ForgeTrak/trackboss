import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    deleteJob,
    getJob,
    getJobList,
    getOpenEventJob,
    insertJob,
    patchJob,
    removeSignup,
    setJobVerifiedState,
} from '../../database/job';
import { getMember } from '../../database/member';
import { getMembership } from '../../database/membership';
import job from '../../api/job';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/job');
jest.mock('../../database/member');
jest.mock('../../database/membership');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));
jest.mock('../../util/billing', () => ({ runBillingComplete: jest.fn() }));
jest.mock('../../excel/workbookHelper', () => ({
    startWorkbook: jest.fn(() => ({
        getWorksheet: () => ({ columns: [], addRow: jest.fn() }),
    })),
    formatWorkbook: jest.fn(),
    httpOutputWorkbook: jest.fn((_wb: unknown, res: any) => {
        res.status(200);
        res.end();
    }),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGetJobList = getJobList as jest.MockedFunction<typeof getJobList>;
const mockedGetJob = getJob as jest.MockedFunction<typeof getJob>;
const mockedPatchJob = patchJob as jest.MockedFunction<typeof patchJob>;
const mockedGetMember = getMember as jest.MockedFunction<typeof getMember>;
const mockedInsertJob = insertJob as jest.MockedFunction<typeof insertJob>;
const mockedGetMembership = getMembership as jest.MockedFunction<typeof getMembership>;
const mockedOpenEventJob = getOpenEventJob as jest.MockedFunction<typeof getOpenEventJob>;
const mockedDeleteJob = deleteJob as jest.MockedFunction<typeof deleteJob>;
const mockedSetVerified = setJobVerifiedState as jest.MockedFunction<typeof setJobVerifiedState>;
const mockedRemoveSignup = removeSignup as jest.MockedFunction<typeof removeSignup>;

describe('api/job', () => {
    const app = createJsonRouterApp('/job', job);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 on /list when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).get('/job/list');
        expect(res.status).toBe(401);
        expect(res.body.reason).toBe('x');
    });

    it('returns job list when authorized', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetJobList.mockResolvedValue([] as any);
        const res = await request(app).get('/job/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetJobList).toHaveBeenCalledWith(expect.any(Object), 'tenant-test');
    });

    it('returns a job by id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetJob.mockResolvedValue({ jobId: 2 } as any);
        const res = await request(app).get('/job/2').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetJob).toHaveBeenCalledWith(2, 'tenant-test');
    });

    it('PATCH /:jobId updates as Member', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetMember.mockResolvedValue({ memberId: 5 } as any);
        mockedGetJob.mockResolvedValue({ jobId: 1 } as any);
        mockedPatchJob.mockResolvedValue(undefined as any);
        const res = await request(app)
            .patch('/job/1')
            .set('Authorization', 'Bearer t')
            .send({ note: 'x' });
        expect(res.status).toBe(200);
        expect(mockedGetMember).toHaveBeenCalledWith('user-test', 'tenant-test');
    });

    it('returns 206 when list range header is set', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetJobList.mockResolvedValue([] as any);
        const res = await request(app)
            .get('/job/list')
            .set('Authorization', 'Bearer t')
            .set('range', '20260101-20261231');
        expect(res.status).toBe(206);
    });

    it('returns 400 when range header has no separator', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app)
            .get('/job/list')
            .set('Authorization', 'Bearer t')
            .set('range', '20260101');
        expect(res.status).toBe(400);
    });

    it('returns 400 when range dates are not numeric yyyymmdd', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app)
            .get('/job/list')
            .set('Authorization', 'Bearer t')
            .set('range', 'abcdefgh-20261231');
        expect(res.status).toBe(400);
    });

    it('POST /new creates job as Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedInsertJob.mockResolvedValue(11);
        mockedGetJob.mockResolvedValue({ jobId: 11 } as any);
        mockedGetMembership.mockResolvedValue({ membershipId: 3 } as any);
        const res = await request(app)
            .post('/job/new')
            .set('Authorization', 'Bearer t')
            .send({
                membershipId: 3,
                jobStartDate: '2026-06-01 09:00',
            });
        expect(res.status).toBe(201);
    });

    it('PATCH /event/:eventId/:memberId signs member up for open job', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedOpenEventJob.mockResolvedValue({ jobId: 7, memberId: 0 } as any);
        mockedPatchJob.mockResolvedValue(undefined as any);
        mockedGetJob.mockResolvedValue({ jobId: 7, memberId: 9 } as any);
        const res = await request(app)
            .patch('/job/event/5/9')
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('GET /list/excel builds workbook', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetJobList.mockResolvedValue([
            {
                event: 'Work Day',
                member: 'A B',
                title: 'Setup',
                jobDay: 'Mon',
                pointsAwarded: 1,
                cashPayout: 0,
                mealTicket: false,
            },
        ] as any);
        const res = await request(app).get('/job/list/excel').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PATCH /verify/:jobId/:state toggles verification', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetJob.mockResolvedValue({ jobId: 8 } as any);
        mockedSetVerified.mockResolvedValue(undefined as any);
        const res = await request(app)
            .patch('/job/verify/8/true')
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PATCH /remove/signup/:jobId clears signup', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetJob.mockResolvedValue({ jobId: 12 } as any);
        mockedRemoveSignup.mockResolvedValue(undefined as any);
        const res = await request(app)
            .patch('/job/remove/signup/12')
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('DELETE /:jobId removes job as Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetJob.mockResolvedValue({ jobId: 13 } as any);
        mockedDeleteJob.mockResolvedValue(undefined as any);
        const res = await request(app).delete('/job/13').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('GET /list returns 400 for invalid assignmentStatus', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app)
            .get('/job/list')
            .query({ assignmentStatus: 'bogus' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(400);
    });

    it('GET /list returns 400 for invalid memberID query', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app)
            .get('/job/list')
            .query({ memberID: 'x' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(400);
    });

    it('POST /new returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).post('/job/new').send({});
        expect(res.status).toBe(401);
    });

    it('POST /new returns 400 on user input error', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedInsertJob.mockRejectedValue(new Error('user input error'));
        const res = await request(app)
            .post('/job/new')
            .set('Authorization', 'Bearer t')
            .send({ membershipId: 1, jobStartDate: '2026-01-01 10:00' });
        expect(res.status).toBe(400);
    });

    it('GET /:jobId returns 404 for NaN id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).get('/job/notanumber').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });
});
