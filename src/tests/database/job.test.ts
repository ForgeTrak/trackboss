jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

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

describe('database/job', () => {
    beforeEach(() => mockQuery.mockReset());

    const jobRow = {
        job_id: 1,
        tenant_id: 't',
        member_id: 2,
        membership_id: 5,
        event_id: 3,
        job_type_id: 4,
        start: new Date(),
        end: new Date(),
        year: 2026,
        verified: Buffer.from([1]),
        paid: Buffer.from([0]),
        verified_date: null,
        paid_date: null,
        points_awarded: 1,
        cash_payout: 0,
        meal_ticket: Buffer.from([0]),
        sort_order: 1,
        job_day_number: 2,
        last_modified_date: '2026-01-01',
        last_modified_by: 9,
        member: 'A B',
        event: 'E',
        title: 'T',
    };

    it('insertJob throws user input error when empty body', async () => {
        await expect(insertJob('t', {} as any)).rejects.toThrow('user input error');
    });

    it('insertJob returns insertId', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 8 } as any]);
        await expect(
            insertJob('t', {
                memberId: 1,
                eventId: 2,
                jobTypeId: 3,
                jobStartDate: '2026-01-01',
                jobEndDate: '2026-01-01',
                verified: false,
                verifiedDate: null,
                pointsAwarded: 1,
                cashPayout: 0,
                paid: false,
                paidDate: null,
                modifiedBy: 9,
            } as any),
        ).resolves.toBe(8);
    });

    it('getJobList with empty filters', async () => {
        mockQuery.mockResolvedValueOnce([[jobRow]]);
        const jobs = await getJobList({}, 't');
        expect(jobs[0].jobId).toBe(1);
    });

    it('getJobList with membership filter', async () => {
        mockQuery.mockResolvedValueOnce([[jobRow]]).mockResolvedValueOnce([[]]);
        await getJobList({ membershipId: 5 } as any, 't');
        expect(mockQuery.mock.calls[0][0]).toContain('membership_id');
    });

    it('getJob returns one job', async () => {
        mockQuery.mockResolvedValueOnce([[jobRow]]);
        const j = await getJob(1, 't');
        expect(j.jobId).toBe(1);
    });

    it('getOpenEventJob returns job or throws', async () => {
        mockQuery.mockResolvedValueOnce([[{ ...jobRow, member_id: null }]]);
        const j = await getOpenEventJob(3, 't');
        expect(j.eventId).toBe(3);
    });

    it('patchJob throws not found when no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            patchJob(1, 't', {
                memberId: 2,
                eventId: 3,
                jobTypeId: 4,
                jobStartDate: '2026-01-01',
                jobEndDate: '2026-01-01',
                pointsAwarded: 1,
                verified: true,
                paid: false,
                modifiedBy: 9,
                paidLabor: false,
                paidLaborId: null,
            } as any),
        ).rejects.toThrow('not found');
    });

    it('setJobVerifiedState returns affected id', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(setJobVerifiedState(1, true, 't')).resolves.toBe(1);
    });

    it('removeSignup returns member id', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(removeSignup(1, 't')).resolves.toBe(1);
    });

    it('deleteJob completes', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(deleteJob(1, 't')).resolves.toBeUndefined();
    });
});
