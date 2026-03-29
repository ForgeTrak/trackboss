jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import { flipRidingAreaStatus, getRidingAreaStatuses } from '../../database/ridingAreaStatus';

describe('database/ridingAreaStatus', () => {
    beforeEach(() => mockQuery.mockReset());

    it('getRidingAreaStatuses maps status byte to isOpen', async () => {
        mockQuery.mockResolvedValueOnce([
            [{ riding_area_status_id: 1, area_name: 'Main', status: Buffer.from([1]) }],
        ]);
        const rows = await getRidingAreaStatuses('t1');
        expect(rows[0].isOpen).toBe(true);
    });

    it('flipRidingAreaStatus updates and returns status object', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        const next = { isOpen: true };
        const out = await flipRidingAreaStatus(3, next, 't1');
        expect(out).toBe(next);
    });

    it('getRidingAreaStatuses maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(getRidingAreaStatuses('t1')).rejects.toThrow('internal server error');
    });

    it('flipRidingAreaStatus still returns status when update fails', async () => {
        mockQuery.mockRejectedValueOnce(new Error('db'));
        const next = { isOpen: false };
        const out = await flipRidingAreaStatus(3, next, 't1');
        expect(out).toBe(next);
    });
});
