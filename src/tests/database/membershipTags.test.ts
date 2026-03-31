jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    cleanMembershipTags,
    createMembershipTag,
    deleteMembershipTag,
    getMembershipTags,
    getUniqueTags,
} from '../../database/membershipTags';

describe('database/membershipTags', () => {
    beforeEach(() => mockQuery.mockReset());

    it('getMembershipTags maps rows', async () => {
        mockQuery.mockResolvedValueOnce([
            [{ membership_tag_id: 1, tenant_id: 't', membership_tag: 'vip', membership_id: 9 }],
        ]);
        const tags = await getMembershipTags(9, 't');
        expect(tags[0]).toMatchObject({ value: 'vip', membershipId: 9 });
    });

    it('createMembershipTag inserts then reloads', async () => {
        mockQuery.mockResolvedValue([[]]);
        const tags = await createMembershipTag(1, ['a', 'b'], 't');
        expect(mockQuery).toHaveBeenCalled();
        expect(Array.isArray(tags)).toBe(true);
    });

    it('deleteMembershipTag deletes then reloads', async () => {
        mockQuery.mockResolvedValue([[]]);
        await deleteMembershipTag(1, ['x'], 't');
        expect(mockQuery).toHaveBeenCalled();
    });

    it('cleanMembershipTags deletes all for membership', async () => {
        mockQuery.mockResolvedValue([[]]);
        await cleanMembershipTags(2, 't');
        expect(mockQuery).toHaveBeenCalled();
    });

    it('getUniqueTags maps aggregate rows', async () => {
        mockQuery.mockResolvedValueOnce([[{ membership_tag: 't1', tag_count: 4 }]]);
        const u = await getUniqueTags('t');
        expect(u[0]).toMatchObject({ value: 't1', count: 4 });
    });
});
