jest.mock('../../database/event', () => ({
    getEventList: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../database/jobType', () => ({
    getJobType: jest.fn().mockResolvedValue({
        jobDayNumber: 1,
        pointValue: 1,
        cashValue: 0,
        mealTicket: false,
    }),
}));
jest.mock('../../database/job', () => ({
    insertJob: jest.fn().mockResolvedValue(99),
}));

jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };
const { getEventList } = require('../../database/event') as { getEventList: jest.Mock };
const { insertJob } = require('../../database/job') as { insertJob: jest.Mock };

import {
    addJobTypeEvents,
    deleteEventJob,
    getEventJob,
    insertEventJob,
    patchEventJob,
    removeJobTypeEvents,
    updateJobsOnEventJob,
} from '../../database/eventJob';

describe('database/eventJob', () => {
    beforeEach(() => {
        mockQuery.mockReset();
        getEventList.mockResolvedValue([]);
        insertJob.mockClear();
    });

    const row = {
        event_job_id: 1,
        tenant_id: 't',
        event_type_id: 2,
        event_type: 'Race',
        job_type_id: 3,
        job_type: 'Gate',
        count: 2,
    };

    it('insertEventJob throws on empty request', async () => {
        await expect(insertEventJob({} as any, 't')).rejects.toThrow('user input error');
    });

    it('insertEventJob maps FK violation to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1452 }));
        await expect(
            insertEventJob({ eventTypeId: 1, jobTypeId: 2, count: 1 } as any, 't'),
        ).rejects.toThrow('user input error');
    });

    it('insertEventJob maps other DB errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 9999 }));
        await expect(
            insertEventJob({ eventTypeId: 1, jobTypeId: 2, count: 1 } as any, 't'),
        ).rejects.toThrow('internal server error');
    });

    it('insertEventJob rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(
            insertEventJob({ eventTypeId: 1, jobTypeId: 2, count: 1 } as any, 't'),
        ).rejects.toBe(err);
    });

    it('insertEventJob returns insertId when no upcoming events', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 5 } as any]);
        await expect(
            insertEventJob({ eventTypeId: 1, jobTypeId: 2, count: 1 } as any, 't'),
        ).resolves.toBe(5);
    });

    it('insertEventJob schedules insertJob per matching event and count', async () => {
        getEventList.mockResolvedValueOnce([
            { eventId: 10, eventTypeId: 1, start: new Date('2026-06-01T12:00:00.000Z') },
        ]);
        mockQuery.mockResolvedValueOnce([{ insertId: 5 } as any]);
        await insertEventJob({ eventTypeId: 1, jobTypeId: 2, count: 2 } as any, 't');
        await new Promise<void>((r) => setImmediate(r));
        expect(insertJob).toHaveBeenCalledTimes(2);
    });

    it('getEventJob returns mapped row', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const ej = await getEventJob(1, 't');
        expect(ej.count).toBe(2);
    });

    it('getEventJob throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getEventJob(1, 't')).rejects.toThrow('not found');
    });

    it('getEventJob maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('db down'));
        await expect(getEventJob(1, 't')).rejects.toThrow('internal server error');
    });

    it('updateJobsOnEventJob returns zero when no grouped rows', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        const n = await updateJobsOnEventJob(1, 't', {
            count: 2,
            eventTypeId: 1,
            jobTypeId: 3,
            modifiedBy: 9,
        } as any);
        expect(n).toBe(0);
    });

    it('updateJobsOnEventJob swallows errors from count query', async () => {
        mockQuery.mockRejectedValueOnce(new Error('bad sql'));
        const n = await updateJobsOnEventJob(1, 't', {
            count: 2,
            eventTypeId: 1,
            jobTypeId: 3,
            modifiedBy: 9,
        } as any);
        expect(n).toBe(0);
    });

    it('addJobTypeEvents calls insertJob for each diff', async () => {
        await addJobTypeEvents(
            2,
            {
                event_id: 7,
                start: '2026-01-01',
                job_day_number: 1,
                points_awarded: 3,
                cash_payout: 0,
                meal_ticket: Buffer.from([1]),
            } as any,
            4,
            9,
            't',
        );
        expect(insertJob).toHaveBeenCalledTimes(2);
    });

    it('removeJobTypeEvents runs delete per removal count', async () => {
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await removeJobTypeEvents(
            { event_id: 1, difference: -2 } as any,
            3,
            't',
        );
        expect(mockQuery).toHaveBeenCalledWith(
            expect.stringContaining('delete from job'),
            [1, 3, 't'],
        );
        expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('patchEventJob throws on empty request', async () => {
        await expect(patchEventJob(1, 't', {} as any)).rejects.toThrow('user input error');
    });

    it('patchEventJob throws not found when update affects no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            patchEventJob(1, 't', {
                eventTypeId: 1,
                jobTypeId: 3,
                count: 2,
                modifiedBy: 9,
            } as any),
        ).rejects.toThrow('not found');
    });

    it('patchEventJob maps FK violations to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1452 }));
        await expect(
            patchEventJob(1, 't', {
                eventTypeId: 1,
                jobTypeId: 3,
                count: 2,
                modifiedBy: 9,
            } as any),
        ).rejects.toThrow('user input error');
    });

    it('patchEventJob maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 5000 }));
        await expect(
            patchEventJob(1, 't', {
                eventTypeId: 1,
                jobTypeId: 3,
                count: 2,
                modifiedBy: 9,
            } as any),
        ).rejects.toThrow('internal server error');
    });

    it('patchEventJob rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(
            patchEventJob(1, 't', {
                eventTypeId: 1,
                jobTypeId: 3,
                count: 2,
                modifiedBy: 9,
            } as any),
        ).rejects.toBe(err);
    });

    it('patchEventJob updates then reconciles jobs', async () => {
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([[]]);
        await patchEventJob(1, 't', {
            eventTypeId: 1,
            jobTypeId: 3,
            count: 2,
            modifiedBy: 9,
        } as any);
        expect(mockQuery).toHaveBeenCalled();
    });

    it('deleteEventJob loads job then deletes rows', async () => {
        mockQuery
            .mockResolvedValueOnce([[row]])
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(deleteEventJob(1, 't')).resolves.toBeUndefined();
    });

    it('deleteEventJob throws not found when event_job delete affects no rows', async () => {
        mockQuery
            .mockResolvedValueOnce([[row]])
            .mockResolvedValueOnce([{ affectedRows: 0 } as any])
            .mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(deleteEventJob(1, 't')).rejects.toThrow('not found');
    });

    it('deleteEventJob maps failures to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(deleteEventJob(1, 't')).rejects.toThrow('internal server error');
    });
});
