jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    getWorkPointsByMember,
    getWorkPointsByMembership,
    getWorkPointsList,
} from '../../database/workPoints';

describe('database/workPoints', () => {
    beforeEach(() => mockQuery.mockReset());

    it('getWorkPointsByMember returns total', async () => {
        mockQuery.mockResolvedValueOnce([[{ total_points: 12 }]]);
        await expect(getWorkPointsByMember(1, 2026, 't')).resolves.toEqual({ total: 12 });
    });

    it('getWorkPointsByMember throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getWorkPointsByMember(1, 2026, 't')).rejects.toThrow('not found');
    });

    it('getWorkPointsByMembership returns zero when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getWorkPointsByMembership(2, 2026, 't')).resolves.toEqual({ total: 0 });
    });

    it('getWorkPointsList maps list rows', async () => {
        mockQuery.mockResolvedValueOnce([
            [
                {
                    tenant_id: 't',
                    first_name: 'A',
                    last_name: 'B',
                    membership_type: 'Full',
                    points_earned: 3,
                },
            ],
        ]);
        const list = await getWorkPointsList(2026, 't');
        expect(list[0]).toMatchObject({ firstName: 'A', total: 3 });
    });

    it('getWorkPointsByMember maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('bad'));
        await expect(getWorkPointsByMember(1, 2026, 't')).rejects.toThrow('internal server error');
    });

    it('getWorkPointsByMembership maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('bad'));
        await expect(getWorkPointsByMembership(2, 2026, 't')).rejects.toThrow('internal server error');
    });

    it('getWorkPointsList rethrows query errors', async () => {
        const err = new Error('list fail');
        mockQuery.mockRejectedValueOnce(err);
        await expect(getWorkPointsList(2026, 't')).rejects.toThrow('list fail');
    });
});
