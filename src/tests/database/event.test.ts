jest.mock('../../database/pool');
const pool = require('../../database/pool') as {
    mockQuery: jest.Mock;
    mockConnQuery: jest.Mock;
    mockRelease: jest.Mock;
};
const { mockQuery, mockConnQuery, mockRelease } = pool;

import { INSERTED_EVENT_ID_OUT, insertEvent, getEventList, getEvent, getClosestEvent, patchEvent, deleteEvent, getRelatedEvents } from '../../database/event';

describe('database/event', () => {
    beforeEach(() => {
        mockQuery.mockReset();
        mockConnQuery.mockReset();
        mockRelease.mockReset();
    });

    const eventRow = {
        event_id: 1,
        tenant_id: 't',
        event_type_id: 2,
        start: new Date('2026-06-01'),
        end: new Date('2026-06-02'),
        event_type: 'Race',
        title: 'T',
        event_description: 'D',
        restrict_signups: 0,
    };

    it('insertEvent uses connection and returns new id', async () => {
        mockConnQuery
            .mockResolvedValueOnce([{} as any, undefined])
            .mockResolvedValueOnce([[{ [INSERTED_EVENT_ID_OUT]: 42 }], undefined]);
        await expect(
            insertEvent('t', {
                startDate: '2026-06-01',
                endDate: '2026-06-02',
                eventTypeId: 1,
                eventName: 'N',
                eventDescription: 'D',
                restrictSignups: false,
            } as any),
        ).resolves.toBe(42);
        expect(mockRelease).toHaveBeenCalled();
    });

    it('getEventList without date range', async () => {
        mockQuery.mockResolvedValueOnce([[eventRow]]);
        const list = await getEventList('t');
        expect(list[0].title).toBe('T');
    });

    it('getEventList with start and end', async () => {
        mockQuery.mockResolvedValueOnce([[eventRow]]);
        await getEventList('t', '2026-01-01', '2026-12-31');
        expect(mockQuery.mock.calls[0][1]).toContain('2026-01-01');
    });

    it('getEvent returns one', async () => {
        mockQuery.mockResolvedValueOnce([[eventRow]]);
        const e = await getEvent(1, 't');
        expect(e.eventId).toBe(1);
    });

    it('getClosestEvent returns row', async () => {
        mockQuery.mockResolvedValueOnce([[eventRow]]);
        const e = await getClosestEvent('t');
        expect(e.eventId).toBe(1);
    });

    it('patchEvent throws not found when no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            patchEvent(1, 't', {
                startDate: '2026-06-01',
                endDate: '2026-06-02',
                eventName: 'N',
                eventDescription: 'D',
                restrictSignups: false,
            } as any),
        ).rejects.toThrow('not found');
    });

    it('deleteEvent runs prerequisite deletes', async () => {
        mockQuery
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(deleteEvent(1, 't')).resolves.toBeUndefined();
        expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('getRelatedEvents returns empty when no relationships', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        const rel = await getRelatedEvents('t', {
            eventTypeId: 9,
            title: 'P',
            tenantId: 't',
            start: new Date(2026, 5, 1, 10, 0, 0),
            end: new Date(2026, 5, 2),
            restrictSignups: false,
        } as any);
        expect(rel).toEqual([]);
    });
});
