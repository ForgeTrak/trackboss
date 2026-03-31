jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    deleteBoardMember,
    getBoardMember,
    getBoardMemberList,
    insertBoardMember,
    patchBoardMember,
} from '../../database/boardMember';

describe('database/boardMember', () => {
    beforeEach(() => mockQuery.mockReset());

    const row = {
        board_id: 1,
        tenant_id: 't',
        membership_id: 2,
        member_id: 3,
        title: 'President',
        title_id: 9,
        year: '2026',
        first_name: 'A',
        last_name: 'B',
        phone_number: '1',
        email: 'e@x.com',
    };

    it('insertBoardMember returns insertId', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 8 } as any]);
        await expect(
            insertBoardMember({
                tenantId: 't',
                year: '2026',
                memberId: 3,
                boardMemberTitleId: 9,
            } as any),
        ).resolves.toBe(8);
    });

    it('getBoardMemberList without year', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const list = await getBoardMemberList('t');
        expect(list[0].title).toBe('President');
    });

    it('getBoardMemberList with year adds filter', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        await getBoardMemberList('t', '2026');
        expect(mockQuery.mock.calls[0][1]).toContain('2026');
    });

    it('getBoardMember returns one', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const b = await getBoardMember('t', 1);
        expect(b.boardId).toBe(1);
    });

    it('patchBoardMember throws when no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(
            patchBoardMember(1, {
                tenantId: 't',
                year: '2027',
                memberId: 3,
                boardMemberTitleId: 9,
            } as any),
        ).rejects.toThrow('not found');
    });

    it('deleteBoardMember throws when no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(deleteBoardMember('t', 1)).rejects.toThrow('not found');
    });

    it('insertBoardMember throws on empty request', async () => {
        await expect(insertBoardMember({} as any)).rejects.toThrow('user input error');
    });

    it('insertBoardMember maps FK violation to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1452 }));
        await expect(
            insertBoardMember({
                tenantId: 't',
                year: '2026',
                memberId: 3,
                boardMemberTitleId: 9,
            } as any),
        ).rejects.toThrow('user input error');
    });

    it('insertBoardMember maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 5000 }));
        await expect(
            insertBoardMember({
                tenantId: 't',
                year: '2026',
                memberId: 3,
                boardMemberTitleId: 9,
            } as any),
        ).rejects.toThrow('internal server error');
    });

    it('insertBoardMember rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(
            insertBoardMember({
                tenantId: 't',
                year: '2026',
                memberId: 3,
                boardMemberTitleId: 9,
            } as any),
        ).rejects.toBe(err);
    });

    it('getBoardMemberList maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(getBoardMemberList('t')).rejects.toThrow('internal server error');
    });

    it('getBoardMember throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getBoardMember('t', 1)).rejects.toThrow('not found');
    });

    it('getBoardMember maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('down'));
        await expect(getBoardMember('t', 1)).rejects.toThrow('internal server error');
    });

    it('patchBoardMember throws on empty request', async () => {
        await expect(patchBoardMember(1, {} as any)).rejects.toThrow('user input error');
    });

    it('patchBoardMember maps FK violations to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1451 }));
        await expect(
            patchBoardMember(1, {
                tenantId: 't',
                year: '2027',
                memberId: 3,
                boardMemberTitleId: 9,
            } as any),
        ).rejects.toThrow('user input error');
    });

    it('patchBoardMember maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 9999 }));
        await expect(
            patchBoardMember(1, {
                tenantId: 't',
                year: '2027',
                memberId: 3,
                boardMemberTitleId: 9,
            } as any),
        ).rejects.toThrow('internal server error');
    });

    it('patchBoardMember rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(
            patchBoardMember(1, {
                tenantId: 't',
                year: '2027',
                memberId: 3,
                boardMemberTitleId: 9,
            } as any),
        ).rejects.toBe(err);
    });

    it('patchBoardMember succeeds when rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(
            patchBoardMember(1, {
                tenantId: 't',
                year: '2027',
                memberId: 3,
                boardMemberTitleId: 9,
            } as any),
        ).resolves.toBeUndefined();
    });

    it('deleteBoardMember succeeds when rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(deleteBoardMember('t', 1)).resolves.toBeUndefined();
    });

    it('deleteBoardMember maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(deleteBoardMember('t', 1)).rejects.toThrow('internal server error');
    });
});
