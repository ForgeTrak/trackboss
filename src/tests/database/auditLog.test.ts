jest.mock('jsondiffpatch', () => ({
    diff: jest.fn(() => ({ patched: true })),
}));

jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import logAuditEvent, { getAuditLogById, getAuditLogByTenant } from '../../database/auditLog';

describe('database/auditLog', () => {
    beforeEach(() => mockQuery.mockReset());

    const req = {
        method: 'PATCH',
        user: { tenantId: 't1', uuid: 'u1', email: 'a@b.com' },
    };

    it('logAuditEvent inserts diff payload for PATCH', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await logAuditEvent(req as any, 'member', 5, { a: 1 }, { a: 2 });
        expect(mockQuery).toHaveBeenCalledWith(
            expect.stringContaining('insert into audit_log'),
            expect.arrayContaining(['t1', 'a@b.com', 'u1', 'member', '5', 'update']),
        );
    });

    it('logAuditEvent maps POST to create action', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await logAuditEvent({ ...req, method: 'POST' } as any, 'member', 5, {}, { a: 1 });
        expect(mockQuery).toHaveBeenCalledWith(
            expect.any(String),
            expect.arrayContaining([expect.anything(), expect.anything(), expect.anything(), 'member', '5', 'create']),
        );
    });

    it('logAuditEvent maps PUT to update action', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await logAuditEvent({ ...req, method: 'PUT' } as any, 'x', 1, {}, {});
        const call = mockQuery.mock.calls[0][1] as string[];
        expect(call[5]).toBe('update');
    });

    it('logAuditEvent maps DELETE to delete action', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await logAuditEvent({ ...req, method: 'DELETE' } as any, 'x', 1, {}, {});
        const call = mockQuery.mock.calls[0][1] as string[];
        expect(call[5]).toBe('delete');
    });

    it('logAuditEvent uses empty action for unknown method', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await logAuditEvent({ ...req, method: 'HEAD' } as any, 'x', 1, {}, {});
        const call = mockQuery.mock.calls[0][1] as string[];
        expect(call[5]).toBe('');
    });

    it('getAuditLogById returns rows', async () => {
        mockQuery.mockResolvedValueOnce([[{ id: 1 }]]);
        const rows = await getAuditLogById('t1', 'bill', '9');
        expect(rows).toEqual([{ id: 1 }]);
    });

    it('getAuditLogByTenant returns joined rows', async () => {
        mockQuery.mockResolvedValueOnce([[{ entity_type: 'x' }]]);
        const rows = await getAuditLogByTenant('t1');
        expect(rows).toHaveLength(1);
    });
});
