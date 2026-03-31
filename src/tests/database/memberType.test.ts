jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    getMemberType,
    getMemberTypeList,
    getMembershipType,
    getMembershipTypeCounts,
    getMembershipTypes,
    patchMemberType,
} from '../../database/memberType';

describe('database/memberType', () => {
    beforeEach(() => mockQuery.mockReset());

    const vRow = {
        member_type_id: 1,
        tenant_id: 't',
        type: 'Member',
        base_dues_amt: 100,
    };

    it('getMemberType throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getMemberType(1, 't')).rejects.toThrow('not found');
    });

    it('getMemberType returns mapped row', async () => {
        mockQuery.mockResolvedValueOnce([[vRow]]);
        const mt = await getMemberType(1, 't');
        expect(mt.type).toBe('Member');
    });

    it('getMembershipType uses membership_types columns', async () => {
        mockQuery.mockResolvedValueOnce([
            [{ membership_type_id: 2, tenant_id: 't', type: 'Guest', base_dues_amt: 50 }],
        ]);
        const mt = await getMembershipType('t', 'Guest');
        expect(mt.memberTypeId).toBe(2);
    });

    it('getMembershipTypes maps list', async () => {
        mockQuery.mockResolvedValueOnce([
            [{ membership_type_id: 1, tenant_id: 't', type: 'A', base_dues_amt: 1 }],
        ]);
        const list = await getMembershipTypes('t');
        expect(list[0].type).toBe('A');
    });

    it('getMemberTypeList maps rows', async () => {
        mockQuery.mockResolvedValueOnce([[vRow]]);
        const list = await getMemberTypeList('t');
        expect(list).toHaveLength(1);
    });

    it('patchMemberType throws not found when no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(patchMemberType(1, 't', { type: 'X', baseDuesAmt: 1 })).rejects.toThrow('not found');
    });

    it('getMembershipTypeCounts maps aggregate', async () => {
        mockQuery.mockResolvedValueOnce([
            [{ membership_type_id: 3, tenant_id: 't', membership_type: 'Full', base_dues_amt: 10, howmany: 4 }],
        ]);
        const counts = await getMembershipTypeCounts('t');
        expect(counts[0].count).toBe(4);
    });

    it('getMemberType maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(getMemberType(1, 't')).rejects.toThrow('internal server error');
    });

    it('getMembershipType throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getMembershipType('t', 'Guest')).rejects.toThrow('not found');
    });

    it('getMembershipType maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('down'));
        await expect(getMembershipType('t', 'Guest')).rejects.toThrow('internal server error');
    });

    it('getMembershipTypes throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getMembershipTypes('t')).rejects.toThrow('not found');
    });

    it('getMembershipTypes maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('bad'));
        await expect(getMembershipTypes('t')).rejects.toThrow('internal server error');
    });

    it('getMemberTypeList maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('bad'));
        await expect(getMemberTypeList('t')).rejects.toThrow('internal server error');
    });

    it('patchMemberType throws on empty request', async () => {
        await expect(patchMemberType(1, 't', {} as any)).rejects.toThrow('user input error');
    });

    it('patchMemberType maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(patchMemberType(1, 't', { type: 'X', baseDuesAmt: 1 })).rejects.toThrow(
            'internal server error',
        );
    });

    it('patchMemberType succeeds when rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(patchMemberType(1, 't', { type: 'X', baseDuesAmt: 1 })).resolves.toBeUndefined();
    });

    it('getMembershipTypeCounts maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('bad'));
        await expect(getMembershipTypeCounts('t')).rejects.toThrow('internal server error');
    });
});
