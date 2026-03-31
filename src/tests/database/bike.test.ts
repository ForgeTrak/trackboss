jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import { deleteBike, getBike, getBikeList, insertBike, patchBike } from '../../database/bike';

describe('database/bike', () => {
    beforeEach(() => mockQuery.mockReset());

    const bikeRow = {
        bike_id: 1,
        tenant_id: 't',
        year: 2026,
        make: 'Y',
        model: 'Z',
        membership_admin: 'a@b.com',
    };

    it('insertBike returns insertId', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 5 } as any]);
        await expect(
            insertBike({
                membershipId: 1,
                year: 2026,
                make: 'Y',
                model: 'Z',
                tenantId: 't',
            } as any),
        ).resolves.toBe(5);
    });

    it('getBikeList maps rows', async () => {
        mockQuery.mockResolvedValueOnce([[bikeRow]]);
        const list = await getBikeList(9, 't');
        expect(list[0].bikeId).toBe(1);
    });

    it('getBike returns one bike', async () => {
        mockQuery.mockResolvedValueOnce([[bikeRow]]);
        const b = await getBike(1, 't');
        expect(b.make).toBe('Y');
    });

    it('patchBike completes when rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(
            patchBike(1, { year: 2025, make: 'M', model: 'X', tenantId: 't' } as any),
        ).resolves.toBeUndefined();
    });

    it('deleteBike throws not found when missing', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(deleteBike(1, 't')).rejects.toThrow('not found');
    });

    it('insertBike maps FK violation to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1452 }));
        await expect(
            insertBike({
                membershipId: 1,
                year: 2026,
                make: 'Y',
                model: 'Z',
                tenantId: 't',
            } as any),
        ).rejects.toThrow('user input error');
    });

    it('insertBike maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 5000 }));
        await expect(
            insertBike({
                membershipId: 1,
                year: 2026,
                make: 'Y',
                model: 'Z',
                tenantId: 't',
            } as any),
        ).rejects.toThrow('internal server error');
    });

    it('insertBike rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(
            insertBike({
                membershipId: 1,
                year: 2026,
                make: 'Y',
                model: 'Z',
                tenantId: 't',
            } as any),
        ).rejects.toBe(err);
    });

    it('getBikeList maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(getBikeList(9, 't')).rejects.toThrow('internal server error');
    });

    it('getBike throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getBike(1, 't')).rejects.toThrow('not found');
    });

    it('getBike maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('down'));
        await expect(getBike(1, 't')).rejects.toThrow('internal server error');
    });

    it('patchBike throws on empty request', async () => {
        await expect(patchBike(1, {} as any)).rejects.toThrow('user input error');
    });

    it('patchBike maps FK violation to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1048 }));
        await expect(
            patchBike(1, { year: 2025, make: 'M', model: 'X', tenantId: 't' } as any),
        ).rejects.toThrow('user input error');
    });

    it('patchBike maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 5000 }));
        await expect(
            patchBike(1, { year: 2025, make: 'M', model: 'X', tenantId: 't' } as any),
        ).rejects.toThrow('internal server error');
    });

    it('patchBike rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(
            patchBike(1, { year: 2025, make: 'M', model: 'X', tenantId: 't' } as any),
        ).rejects.toBe(err);
    });

    it('patchBike throws not found when no rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            patchBike(1, { year: 2025, make: 'M', model: 'X', tenantId: 't' } as any),
        ).rejects.toThrow('not found');
    });

    it('deleteBike succeeds when rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(deleteBike(1, 't')).resolves.toBeUndefined();
    });

    it('deleteBike maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(deleteBike(1, 't')).rejects.toThrow('internal server error');
    });
});
