jest.mock('../../util/cognito', () => ({
    createCognitoUser: jest.fn().mockResolvedValue('uuid-new'),
}));

jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    deleteFamilyMember,
    getEligibleVoters,
    getMember,
    getMemberByEmail,
    getMemberByPhone,
    getMemberList,
    getMembersWithTag,
    getValidActors,
    insertMember,
    patchMember,
} from '../../database/member';

describe('database/member', () => {
    beforeEach(() => {
        mockQuery.mockReset();
    });

    const memberRow = {
        tenant_id: 't',
        member_id: 1,
        membership_id: 2,
        first_name: 'A',
        last_name: 'B',
        membership_admin: 'a@b.com',
        membership_admin_id: 1,
        board_title_id: null,
        active: Buffer.from([1]),
        member_type_id: 3,
        member_type: 'Member',
        membership_type: 'Full',
        phone_number: '555',
        occupation: 'x',
        email: 'a@b.com',
        birthdate: '2000-01-01',
        date_joined: '2020-01-01',
        address: '',
        city: '',
        state: '',
        zip: '',
        cancel_reason: null,
        subscribed: 'true',
        dependent_status: '',
        is_eligible_dependent: 0,
        last_modified_date: '2026-01-01',
        last_modified_by: 1,
        uuid: 'uuid-1',
        membership_type_id: 4,
    };

    it('insertMember without email inserts row', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 15 } as any]);
        await expect(
            insertMember(
                {
                    membershipId: 1,
                    memberTypeId: 3,
                    firstName: 'A',
                    lastName: 'B',
                    phoneNumber: '1',
                    occupation: 'o',
                    birthdate: '2000-01-01',
                    dateJoined: '2020-01-01',
                    modifiedBy: 1,
                    subscribed: true,
                    dependentStatus: '',
                } as any,
                't',
            ),
        ).resolves.toBe(15);
    });

    it('getMemberList with empty filters', async () => {
        mockQuery.mockResolvedValueOnce([[memberRow]]);
        const list = await getMemberList({}, 't');
        expect(list[0].memberId).toBe(1);
    });

    it('getMemberList with type filter uses map', async () => {
        mockQuery.mockResolvedValueOnce([[memberRow]]);
        await getMemberList({ type: 'admin' } as any, 't');
        expect(mockQuery.mock.calls[0][0]).toContain('member_type');
    });

    it('getMember by id', async () => {
        mockQuery.mockResolvedValueOnce([[memberRow]]);
        const m = await getMember('1', 't');
        expect(m.email).toBe('a@b.com');
    });

    it('getMemberByPhone returns member', async () => {
        mockQuery.mockResolvedValueOnce([[memberRow]]);
        const m = await getMemberByPhone('555', 't');
        expect(m.memberId).toBe(1);
    });

    it('getMemberByEmail returns row', async () => {
        mockQuery.mockResolvedValueOnce([[{ ...memberRow, active: Buffer.from([1]) }]]);
        const m = await getMemberByEmail('a@b.com', 't');
        expect(m.email).toBe('a@b.com');
    });

    it('patchMember completes', async () => {
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([[]]);
        await expect(
            patchMember(
                '1',
                {
                    membershipId: 2,
                    uuid: 'uuid-1',
                    active: true,
                    memberTypeId: 3,
                    firstName: 'X',
                    lastName: 'B',
                    phoneNumber: '555',
                    occupation: 'o',
                    email: 'a@b.com',
                    birthdate: '2000-01-01',
                    dateJoined: '2020-01-01',
                    modifiedBy: 1,
                    subscribed: true,
                    dependentStatus: '',
                    isEligibleDependent: false,
                } as any,
                't',
            ),
        ).resolves.toBeUndefined();
    });

    it('getValidActors returns ids', async () => {
        mockQuery.mockResolvedValueOnce([[{ member_id: 7 }]]);
        await expect(getValidActors(10, 't')).resolves.toEqual([7]);
    });

    it('deleteFamilyMember returns affected rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(deleteFamilyMember(9, 't')).resolves.toBe(1);
    });

    it('getEligibleVoters maps rows', async () => {
        mockQuery.mockResolvedValueOnce([
            [
                {
                    last_name: 'L',
                    first_name: 'F',
                    year: 2026,
                    membership_type: 'Full',
                    meetings_attended: 1,
                    percentage_meetings: '50',
                    points_earned: 2,
                    eligible_by_points: 'Y',
                    eligible_by_meetings: 'N',
                },
            ],
        ]);
        const v = await getEligibleVoters(2026);
        expect(v.length).toBe(1);
    });

    it('getMembersWithTag returns members', async () => {
        mockQuery.mockResolvedValueOnce([[memberRow]]);
        const list = await getMembersWithTag('vip');
        expect(list[0].memberId).toBe(1);
    });
});
