jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import { getLinks } from '../../database/link';

describe('database/link', () => {
    beforeEach(() => mockQuery.mockReset());

    it('maps rows to Link objects', async () => {
        mockQuery.mockResolvedValueOnce([
            [
                {
                    link_id: 1,
                    tenant_id: 't1',
                    link_title: 'Home',
                    link_url: 'https://x.com',
                    display_order: 2,
                },
            ],
        ]);
        const links = await getLinks('t1');
        expect(links).toEqual([
            {
                linkId: 1,
                tenantId: 't1',
                linkTitle: 'Home',
                linkUrl: 'https://x.com',
                linkDisplayOrder: 2,
            },
        ]);
    });

    it('throws internal server error on DB failure', async () => {
        mockQuery.mockRejectedValueOnce(new Error('db'));
        await expect(getLinks('t1')).rejects.toThrow('internal server error');
    });
});
