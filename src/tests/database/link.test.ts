jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    createLink,
    deleteLinkById,
    getAllLinks,
    getLinkById,
    getLinks,
    updateLink,
} from '../../database/link';

describe('database/link', () => {
    beforeEach(() => mockQuery.mockReset());

    const row = {
        link_id: 1,
        tenant_id: 't1',
        link_title: 'Home',
        link_url: 'https://x.com',
        display_order: 2,
        online: 1,
    };

    it('getLinks maps rows to Link objects', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const links = await getLinks('t1');
        expect(links).toEqual([
            {
                linkId: 1,
                tenantId: 't1',
                linkTitle: 'Home',
                linkUrl: 'https://x.com',
                linkDisplayOrder: 2,
                online: true,
            },
        ]);
    });

    it('getLinks throws internal server error on DB failure', async () => {
        mockQuery.mockRejectedValueOnce(new Error('db'));
        await expect(getLinks('t1')).rejects.toThrow('internal server error');
    });

    it('getAllLinks maps rows including offline links', async () => {
        mockQuery.mockResolvedValueOnce([
            [
                row,
                { ...row, link_id: 2, online: 0 },
            ],
        ]);
        const links = await getAllLinks('t1');
        expect(links).toHaveLength(2);
        expect(links[0].online).toBe(true);
        expect(links[1].online).toBe(false);
    });

    it('getAllLinks throws internal server error on DB failure', async () => {
        mockQuery.mockRejectedValueOnce(new Error('db'));
        await expect(getAllLinks('t1')).rejects.toThrow('internal server error');
    });

    it('getLinkById returns one link', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const found = await getLinkById(1, 't1');
        expect(found.linkId).toBe(1);
        expect(found.online).toBe(true);
    });

    it('getLinkById throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getLinkById(99, 't1')).rejects.toThrow('not found');
    });

    it('getLinkById throws internal server error on DB failure', async () => {
        mockQuery.mockRejectedValueOnce(new Error('db'));
        await expect(getLinkById(1, 't1')).rejects.toThrow('internal server error');
    });

    it('deleteLinkById succeeds when rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(deleteLinkById(1, 't1')).resolves.toEqual({ linkId: 1 });
    });

    it('deleteLinkById throws not found when no rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(deleteLinkById(1, 't1')).rejects.toThrow('not found');
    });

    it('deleteLinkById throws internal server error on DB failure', async () => {
        mockQuery.mockRejectedValueOnce(new Error('db'));
        await expect(deleteLinkById(1, 't1')).rejects.toThrow('internal server error');
    });

    it('createLink inserts and reloads', async () => {
        mockQuery
            .mockResolvedValueOnce([{ insertId: 7, affectedRows: 1 } as any])
            .mockResolvedValueOnce([[{ ...row, link_id: 7 }]]);
        const created = await createLink(
            {
                linkTitle: 'Home',
                linkUrl: 'https://x.com',
                linkDisplayOrder: 2,
                online: true,
            },
            't1',
        );
        expect(created.linkId).toBe(7);
    });

    it('createLink defaults online to 1 and auto-assigns display_order when omitted', async () => {
        mockQuery
            .mockResolvedValueOnce([[{ next_order: 5 }]])
            .mockResolvedValueOnce([{ insertId: 8, affectedRows: 1 } as any])
            .mockResolvedValueOnce([[{ ...row, link_id: 8, display_order: 5 }]]);
        const created = await createLink(
            {
                linkTitle: 'Home',
                linkUrl: 'https://x.com',
            },
            't1',
        );
        expect(created.linkId).toBe(8);
        expect(created.linkDisplayOrder).toBe(5);
    });

    it('createLink falls back to 1 when next_order row is empty', async () => {
        mockQuery
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([{ insertId: 9, affectedRows: 1 } as any])
            .mockResolvedValueOnce([[{ ...row, link_id: 9, display_order: 1 }]]);
        const created = await createLink(
            {
                linkTitle: 'Home',
                linkUrl: 'https://x.com',
            },
            't1',
        );
        expect(created.linkId).toBe(9);
        expect(created.linkDisplayOrder).toBe(1);
    });

    it('createLink throws not found when insert reports no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 0, affectedRows: 0 } as any]);
        await expect(
            createLink(
                { linkTitle: 'Home', linkUrl: 'https://x.com', linkDisplayOrder: 1 },
                't1',
            ),
        ).rejects.toThrow('not found');
    });

    it('createLink throws internal server error on DB failure', async () => {
        mockQuery.mockRejectedValueOnce(new Error('db'));
        await expect(
            createLink(
                { linkTitle: 'Home', linkUrl: 'https://x.com', linkDisplayOrder: 1 },
                't1',
            ),
        ).rejects.toThrow('internal server error');
    });

    it('updateLink updates and reloads', async () => {
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([[{ ...row, online: 0 }]]);
        const updated = await updateLink(
            1,
            {
                linkTitle: 'Home',
                linkUrl: 'https://x.com',
                linkDisplayOrder: 2,
                online: false,
            },
            't1',
        );
        expect(updated.linkId).toBe(1);
        expect(updated.online).toBe(false);
    });

    it('updateLink defaults online to 1 when omitted', async () => {
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([[row]]);
        const updated = await updateLink(
            1,
            {
                linkTitle: 'Home',
                linkUrl: 'https://x.com',
                linkDisplayOrder: 2,
            },
            't1',
        );
        expect(updated.online).toBe(true);
    });

    it('updateLink throws not found when no rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            updateLink(
                1,
                { linkTitle: 'Home', linkUrl: 'https://x.com', linkDisplayOrder: 2 },
                't1',
            ),
        ).rejects.toThrow('not found');
    });

    it('updateLink throws internal server error on DB failure', async () => {
        mockQuery.mockRejectedValueOnce(new Error('db'));
        await expect(
            updateLink(
                1,
                { linkTitle: 'Home', linkUrl: 'https://x.com', linkDisplayOrder: 2 },
                't1',
            ),
        ).rejects.toThrow('internal server error');
    });
});
