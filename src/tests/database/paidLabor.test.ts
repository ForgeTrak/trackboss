jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    createPaidLabor,
    deletePaidLaborById,
    getPaidLabor,
    getPaidLaborById,
    updatePaidLabor,
} from '../../database/paidLabor';

describe('database/paidLabor', () => {
    beforeEach(() => mockQuery.mockReset());

    const row = {
        paid_labor_id: 1,
        tenant_id: 't',
        first_name: 'A',
        last_name: 'B',
        business_name: 'Biz',
        phone: '555',
        phone_number: '555',
        email: 'e@x.com',
    };

    it('getPaidLabor maps list', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const list = await getPaidLabor('t');
        expect(list[0].paidLaborId).toBe(1);
    });

    it('getPaidLaborById returns one', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const p = await getPaidLaborById(1, 't');
        expect(p.email).toBe('e@x.com');
    });

    it('deletePaidLaborById throws when missing', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(deletePaidLaborById(1, 't')).rejects.toThrow('not found');
    });

    it('createPaidLabor inserts and reloads', async () => {
        mockQuery
            .mockResolvedValueOnce([{ insertId: 7, affectedRows: 1 } as any])
            .mockResolvedValueOnce([[{ ...row, paid_labor_id: 7 }]]);
        const created = await createPaidLabor(
            {
                businessName: 'B',
                email: 'e@x.com',
                firstName: 'A',
                lastName: 'L',
                phoneNumber: '1',
            } as any,
            't',
        );
        expect(created.paidLaborId).toBe(7);
    });

    it('updatePaidLabor updates and reloads', async () => {
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([[row]]);
        const u = await updatePaidLabor(
            1,
            {
                businessName: 'B',
                email: 'e@x.com',
                firstName: 'A',
                lastName: 'L',
                phoneNumber: '1',
            } as any,
            't',
        );
        expect(u.paidLaborId).toBe(1);
    });

    it('getPaidLabor maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(getPaidLabor('t')).rejects.toThrow('internal server error');
    });

    it('getPaidLaborById maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('down'));
        await expect(getPaidLaborById(1, 't')).rejects.toThrow('internal server error');
    });

    it('deletePaidLaborById succeeds when rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(deletePaidLaborById(1, 't')).resolves.toEqual({ paidLaborId: 1 });
    });

    it('deletePaidLaborById maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('bad'));
        await expect(deletePaidLaborById(1, 't')).rejects.toThrow('internal server error');
    });

    it('createPaidLabor maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('bad'));
        await expect(
            createPaidLabor(
                {
                    businessName: 'B',
                    email: 'e@x.com',
                    firstName: 'A',
                    lastName: 'L',
                    phoneNumber: '1',
                } as any,
                't',
            ),
        ).rejects.toThrow('internal server error');
    });

    it('createPaidLabor throws not found when insert reports no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 0, affectedRows: 0 } as any]);
        await expect(
            createPaidLabor(
                {
                    businessName: 'B',
                    email: 'e@x.com',
                    firstName: 'A',
                    lastName: 'L',
                    phoneNumber: '1',
                } as any,
                't',
            ),
        ).rejects.toThrow('not found');
    });

    it('updatePaidLabor maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('bad'));
        await expect(
            updatePaidLabor(
                1,
                {
                    businessName: 'B',
                    email: 'e@x.com',
                    firstName: 'A',
                    lastName: 'L',
                    phoneNumber: '1',
                } as any,
                't',
            ),
        ).rejects.toThrow('internal server error');
    });

    it('updatePaidLabor throws not found when no rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            updatePaidLabor(
                1,
                {
                    businessName: 'B',
                    email: 'e@x.com',
                    firstName: 'A',
                    lastName: 'L',
                    phoneNumber: '1',
                } as any,
                't',
            ),
        ).rejects.toThrow('not found');
    });
});
