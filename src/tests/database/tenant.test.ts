jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import { getTenants, getTenantById } from '../../database/tenant';

describe('database/tenant', () => {
    beforeEach(() => mockQuery.mockReset());

    const row = {
        tenant_id: 't-1',
        name: 'Palmyra MX',
        tenant_contact_name: 'Jane Doe',
        tenant_email: 'jane@example.com',
        tenant_phone: '555-1234',
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-06-01'),
    };

    // --- getTenants ---

    it('getTenants returns mapped list', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const list = await getTenants();
        expect(list).toHaveLength(1);
        expect(list[0]).toEqual({
            tenantId: 't-1',
            name: 'Palmyra MX',
            contactName: 'Jane Doe',
            contactEmail: 'jane@example.com',
            contactPhone: '555-1234',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-06-01'),
        });
    });

    it('getTenants returns empty array when no rows', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        const list = await getTenants();
        expect(list).toEqual([]);
    });

    it('getTenants throws internal server error on DB failure', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(getTenants()).rejects.toThrow('internal server error');
    });

    // --- getTenantById ---

    it('getTenantById returns mapped tenant', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const tenant = await getTenantById('t-1');
        expect(tenant).toEqual({
            tenantId: 't-1',
            name: 'Palmyra MX',
            contactName: 'Jane Doe',
            contactEmail: 'jane@example.com',
            contactPhone: '555-1234',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-06-01'),
        });
    });

    it('getTenantById passes tenantId as query parameter', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        await getTenantById('t-1');
        expect(mockQuery).toHaveBeenCalledWith(
            expect.any(String),
            ['t-1'],
        );
    });

    it('getTenantById throws tenant not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getTenantById('missing')).rejects.toThrow('tenant not found');
    });

    it('getTenantById throws internal server error on DB failure', async () => {
        mockQuery.mockRejectedValueOnce(new Error('connection lost'));
        await expect(getTenantById('t-1')).rejects.toThrow('internal server error');
    });
});
