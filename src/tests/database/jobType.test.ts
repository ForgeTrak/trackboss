jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    getJobType,
    getJobTypeList,
    getJobTypesEventList,
    insertJobType,
    patchJobType,
} from '../../database/jobType';

describe('database/jobType', () => {
    beforeEach(() => mockQuery.mockReset());

    const row = {
        job_type_id: 1,
        tenant_id: 't',
        title: 'Gate',
        point_value: 2,
        cash_value: 0,
        job_day_number: 3,
        active: Buffer.from([1]),
        reserved: Buffer.from([0]),
        online: Buffer.from([1]),
        meal_ticket: Buffer.from([0]),
        sort_order: 1,
        last_modified_date: '2026-01-01',
        last_modified_by: 9,
        event_job_id: 5,
        count: 2,
    };

    it('insertJobType returns insertId', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 6 } as any]);
        await expect(
            insertJobType('t', {
                title: 'T',
                pointValue: 1,
                cashValue: 0,
                jobDayNumber: 1,
                mealTicket: false,
                modifiedBy: 2,
            } as any),
        ).resolves.toBe(6);
    });

    it('getJobType maps row', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const jt = await getJobType(1, 't');
        expect(jt.title).toBe('Gate');
    });

    it('getJobTypeList maps rows', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const list = await getJobTypeList('t');
        expect(list[0].jobTypeId).toBe(1);
    });

    it('getJobTypesEventList filters by event type name', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const list = await getJobTypesEventList('t', 'Race');
        expect(list).toHaveLength(1);
    });

    it('patchJobType throws when update affects no rows', async () => {
        mockQuery
            .mockResolvedValueOnce([[row]])
            .mockResolvedValueOnce([{ affectedRows: 0 } as any])
            .mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            patchJobType('t', 1, {
                title: 'X',
                pointValue: 1,
                cashValue: 0,
                jobDayNumber: 1,
                reserved: false,
                online: true,
                mealTicket: false,
                sortOrder: 1,
                active: true,
                modifiedBy: 1,
            } as any),
        ).rejects.toThrow(/job type with id/);
    });

    it('patchJobType throws on empty request', async () => {
        await expect(patchJobType('t', 1, {} as any)).rejects.toThrow('user input error');
    });

    it('getJobType throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getJobType(1, 't')).rejects.toThrow('not found');
    });

    it('getJobType maps DB errors to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(getJobType(1, 't')).rejects.toThrow('internal server error');
    });

    it('getJobTypeList rethrows query errors', async () => {
        const err = new Error('bad');
        mockQuery.mockRejectedValueOnce(err);
        await expect(getJobTypeList('t')).rejects.toThrow('bad');
    });

    it('getJobTypesEventList maps DB errors to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('down'));
        await expect(getJobTypesEventList('t', 'Race')).rejects.toThrow('internal server error');
    });

    it('getJobTypesEventList filters rows by tenant_id', async () => {
        const otherTenant = { ...row, tenant_id: 'other' };
        mockQuery.mockResolvedValueOnce([[row, otherTenant]]);
        const list = await getJobTypesEventList('t', 'Race');
        expect(list).toHaveLength(1);
        expect(list[0].tenantId).toBe('t');
    });

    it('insertJobType maps FK violation to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1452 }));
        await expect(
            insertJobType('t', {
                title: 'T',
                pointValue: 1,
                cashValue: 0,
                jobDayNumber: 1,
                reserved: false,
                online: true,
                mealTicket: false,
                sortOrder: 1,
                modifiedBy: 2,
            } as any),
        ).rejects.toThrow('user input error');
    });

    it('insertJobType maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 5000 }));
        await expect(
            insertJobType('t', {
                title: 'T',
                pointValue: 1,
                cashValue: 0,
                jobDayNumber: 1,
                reserved: false,
                online: true,
                mealTicket: false,
                sortOrder: 1,
                modifiedBy: 2,
            } as any),
        ).rejects.toThrow('internal server error');
    });

    it('insertJobType rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(
            insertJobType('t', {
                title: 'T',
                pointValue: 1,
                cashValue: 0,
                jobDayNumber: 1,
                reserved: false,
                online: true,
                mealTicket: false,
                sortOrder: 1,
                modifiedBy: 2,
            } as any),
        ).rejects.toBe(err);
    });

    it('patchJobType maps FK violations to user input error', async () => {
        mockQuery
            .mockResolvedValueOnce([[row]])
            .mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1451 }));
        await expect(
            patchJobType('t', 1, {
                title: 'X',
                pointValue: 1,
                cashValue: 0,
                jobDayNumber: 1,
                reserved: false,
                online: true,
                mealTicket: false,
                sortOrder: 1,
                active: true,
                modifiedBy: 1,
            } as any),
        ).rejects.toThrow('user input error');
    });

    it('patchJobType maps other errno to internal server error', async () => {
        mockQuery
            .mockResolvedValueOnce([[row]])
            .mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 9999 }));
        await expect(
            patchJobType('t', 1, {
                title: 'X',
                pointValue: 1,
                cashValue: 0,
                jobDayNumber: 1,
                reserved: false,
                online: true,
                mealTicket: false,
                sortOrder: 1,
                active: true,
                modifiedBy: 1,
            } as any),
        ).rejects.toThrow('internal server error');
    });

    it('patchJobType succeeds when update affects rows', async () => {
        mockQuery
            .mockResolvedValueOnce([[row]])
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            patchJobType('t', 1, {
                title: 'X',
                pointValue: 2,
                cashValue: 0,
                jobDayNumber: 1,
                reserved: false,
                online: true,
                mealTicket: false,
                sortOrder: 1,
                active: true,
                modifiedBy: 1,
            } as any),
        ).resolves.toBeUndefined();
    });

    it('patchJobType rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockResolvedValueOnce([[row]]).mockRejectedValueOnce(err);
        await expect(
            patchJobType('t', 1, {
                title: 'X',
                pointValue: 1,
                cashValue: 0,
                jobDayNumber: 1,
                reserved: false,
                online: true,
                mealTicket: false,
                sortOrder: 1,
                active: true,
                modifiedBy: 1,
            } as any),
        ).rejects.toBe(err);
    });
});
