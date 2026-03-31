jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    getEventType,
    getEventTypeList,
    insertEventType,
    patchEventType,
} from '../../database/eventType';

describe('database/eventType', () => {
    beforeEach(() => mockQuery.mockReset());

    const row = {
        event_type_id: 1,
        tenant_id: 't',
        type: 'Race',
        active: Buffer.from([1]),
        last_modified_date: '2026-01-01',
        last_modified_by: 2,
        default_end: '17:00',
        default_start: '09:00',
    };

    it('insertEventType returns insertId', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 4 } as any]);
        await expect(
            insertEventType('t', { type: 'X', modifiedBy: 1 } as any),
        ).resolves.toBe(4);
    });

    it('getEventType maps row', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const et = await getEventType(1, 't');
        expect(et.type).toBe('Race');
        expect(et.active).toBe(true);
    });

    it('getEventTypeList maps rows', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const list = await getEventTypeList('t');
        expect(list[0].eventTypeId).toBe(1);
    });

    it('patchEventType throws not found when no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            patchEventType(1, 't', { type: 'Y', active: true, modifiedBy: 2 } as any),
        ).rejects.toThrow('not found');
    });

    it('insertEventType maps FK violation to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1452 }));
        await expect(insertEventType('t', { type: 'X', modifiedBy: 1 } as any)).rejects.toThrow('user input error');
    });

    it('insertEventType maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 5000 }));
        await expect(insertEventType('t', { type: 'X', modifiedBy: 1 } as any)).rejects.toThrow(
            'internal server error',
        );
    });

    it('insertEventType rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(insertEventType('t', { type: 'X', modifiedBy: 1 } as any)).rejects.toBe(err);
    });

    it('getEventType throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getEventType(1, 't')).rejects.toThrow('not found');
    });

    it('getEventType maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(getEventType(1, 't')).rejects.toThrow('internal server error');
    });

    it('getEventTypeList maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('down'));
        await expect(getEventTypeList('t')).rejects.toThrow('internal server error');
    });

    it('patchEventType throws on empty request', async () => {
        await expect(patchEventType(1, 't', {} as any)).rejects.toThrow('user input error');
    });

    it('patchEventType maps FK violations to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1451 }));
        await expect(
            patchEventType(1, 't', { type: 'Y', active: true, modifiedBy: 2 } as any),
        ).rejects.toThrow('user input error');
    });

    it('patchEventType maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 9999 }));
        await expect(
            patchEventType(1, 't', { type: 'Y', active: true, modifiedBy: 2 } as any),
        ).rejects.toThrow('internal server error');
    });

    it('patchEventType rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(
            patchEventType(1, 't', { type: 'Y', active: true, modifiedBy: 2 } as any),
        ).rejects.toBe(err);
    });

    it('patchEventType succeeds when rows are affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(
            patchEventType(1, 't', { type: 'Y', active: true, modifiedBy: 2 } as any),
        ).resolves.toBeUndefined();
    });
});
