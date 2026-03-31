jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    getBaseDues,
    getMembership,
    getMembershipList,
    insertMembership,
    markMembershipFormer,
    patchMembership,
    upgradeMembershipSenior,
} from '../../database/membership';

describe('database/membership', () => {
    beforeEach(() => mockQuery.mockReset());

    const mRow = {
        membership_id: 1,
        tenant_id: 't',
        membership_admin: 'a@b.com',
        status: 'active',
        membership_type: 'Full',
        cur_year_renewed: Buffer.from([1]),
        renewal_sent: Buffer.from([0]),
        year_joined: 2020,
        address: '1 St',
        city: 'C',
        state: 'PA',
        zip: '17000',
        last_modified_date: '2026-01-01',
        last_modified_by: 2,
    };

    it('insertMembership returns insertId', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 12 } as any]);
        await expect(
            insertMembership(
                {
                    membershipAdminId: 1,
                    yearJoined: 2026,
                    address: 'a',
                    city: 'c',
                    state: 's',
                    zip: 'z',
                    modifiedBy: 2,
                    membershipTypeId: 3,
                } as any,
                't',
            ),
        ).resolves.toBe(12);
    });

    it('getMembershipList without status', async () => {
        mockQuery.mockResolvedValueOnce([[mRow]]);
        const list = await getMembershipList(undefined, 't');
        expect(list[0].membershipId).toBe(1);
    });

    it('getMembershipList with status adds filter', async () => {
        mockQuery.mockResolvedValueOnce([[mRow]]);
        await getMembershipList('active', 't');
        expect(mockQuery.mock.calls[0][0]).toContain('status');
    });

    it('getMembership returns one', async () => {
        mockQuery.mockResolvedValueOnce([[mRow]]);
        const m = await getMembership(1, 't');
        expect(m.membershipAdmin).toBe('a@b.com');
    });

    it('patchMembership runs optional type update', async () => {
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await patchMembership(
            1,
            {
                membershipAdminId: 2,
                status: 'active',
                curYearRenewed: true,
                renewalSent: false,
                yearJoined: 2020,
                address: 'a',
                city: 'c',
                state: 's',
                zip: 'z',
                modifiedBy: 3,
                membershipTypeId: 9,
            } as any,
            't',
        );
        expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('getBaseDues returns amount', async () => {
        mockQuery.mockResolvedValueOnce([[{ base_dues_amt: 75 }]]);
        await expect(getBaseDues(1, 't')).resolves.toBe(75);
    });

    it('markMembershipFormer returns id', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(markMembershipFormer(1, 'left', 't')).resolves.toBe(1);
    });

    it('upgradeMembershipSenior returns id', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(upgradeMembershipSenior(2, 't')).resolves.toBe(2);
    });
});
