jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    deleteBoardMemberType,
    getBoardMemberType,
    getBoardMemberTypeList,
    insertBoardMemberType,
    patchBoardMemberType,
} from '../../database/boardMemberType';

describe('database/boardMemberType', () => {
    beforeEach(() => mockQuery.mockReset());

    const row = { board_title_id: 1, title: 'President' };

    it('insertBoardMemberType returns insertId', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 3 } as any]);
        await expect(insertBoardMemberType({ title: 'VP' } as any)).resolves.toBe(3);
    });

    it('getBoardMemberTypeList maps rows', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const list = await getBoardMemberTypeList();
        expect(list[0].title).toBe('President');
    });

    it('getBoardMemberType returns one', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const b = await getBoardMemberType(1);
        expect(b.boardTypeId).toBe(1);
    });

    it('patchBoardMemberType throws when no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(patchBoardMemberType(1, { title: 'X' } as any)).rejects.toThrow('not found');
    });

    it('deleteBoardMemberType throws when no rows', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 } as any]);
        await expect(deleteBoardMemberType(9)).rejects.toThrow('not found');
    });

    it('insertBoardMemberType throws on empty request', async () => {
        await expect(insertBoardMemberType({} as any)).rejects.toThrow('user input error');
    });

    it('insertBoardMemberType maps FK violation to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1452 }));
        await expect(insertBoardMemberType({ title: 'VP' } as any)).rejects.toThrow('user input error');
    });

    it('insertBoardMemberType maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 5000 }));
        await expect(insertBoardMemberType({ title: 'VP' } as any)).rejects.toThrow('internal server error');
    });

    it('insertBoardMemberType rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(insertBoardMemberType({ title: 'VP' } as any)).rejects.toBe(err);
    });

    it('getBoardMemberTypeList maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(getBoardMemberTypeList()).rejects.toThrow('internal server error');
    });

    it('getBoardMemberType throws not found when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getBoardMemberType(1)).rejects.toThrow('not found');
    });

    it('getBoardMemberType maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('down'));
        await expect(getBoardMemberType(1)).rejects.toThrow('internal server error');
    });

    it('patchBoardMemberType throws on empty request', async () => {
        await expect(patchBoardMemberType(1, {} as any)).rejects.toThrow('user input error');
    });

    it('patchBoardMemberType maps FK violations to user input error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('fk'), { errno: 1451 }));
        await expect(patchBoardMemberType(1, { title: 'X' } as any)).rejects.toThrow('user input error');
    });

    it('patchBoardMemberType maps other errno to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(Object.assign(new Error('db'), { errno: 9999 }));
        await expect(patchBoardMemberType(1, { title: 'X' } as any)).rejects.toThrow('internal server error');
    });

    it('patchBoardMemberType rethrows errors without errno', async () => {
        const err = new Error('weird');
        mockQuery.mockRejectedValueOnce(err);
        await expect(patchBoardMemberType(1, { title: 'X' } as any)).rejects.toBe(err);
    });

    it('patchBoardMemberType succeeds when rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(patchBoardMemberType(1, { title: 'X' } as any)).resolves.toBeUndefined();
    });

    it('deleteBoardMemberType succeeds when rows affected', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 } as any]);
        await expect(deleteBoardMemberType(9)).resolves.toBeUndefined();
    });

    it('deleteBoardMemberType maps query failure to internal server error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(deleteBoardMemberType(9)).rejects.toThrow('internal server error');
    });
});
