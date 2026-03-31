import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    deleteBoardMember,
    getBoardMember,
    getBoardMemberList,
    insertBoardMember,
    patchBoardMember,
} from '../../database/boardMember';
import boardMember from '../../api/boardMember';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/boardMember');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedList = getBoardMemberList as jest.MockedFunction<typeof getBoardMemberList>;
const mockedGet = getBoardMember as jest.MockedFunction<typeof getBoardMember>;
const mockedInsert = insertBoardMember as jest.MockedFunction<typeof insertBoardMember>;
const mockedPatch = patchBoardMember as jest.MockedFunction<typeof patchBoardMember>;
const mockedDelete = deleteBoardMember as jest.MockedFunction<typeof deleteBoardMember>;

describe('api/boardMember', () => {
    const app = createJsonRouterApp('/bm', boardMember);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 on /list without auth', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'm', token: '' });
        const res = await request(app).get('/bm/list');
        expect(res.status).toBe(401);
    });

    it('returns board member list', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedList.mockResolvedValue([] as any);
        const res = await request(app).get('/bm/list?year=2026').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedList).toHaveBeenCalledWith('tenant-test', '2026');
    });

    it('returns 404 for invalid id on GET /:boardMemberId', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).get('/bm/bad').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('returns one board member by id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet.mockResolvedValue({ boardMemberId: 3 } as any);
        const res = await request(app).get('/bm/3').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('POST /new creates board member as Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedInsert.mockResolvedValue(9);
        mockedGet.mockResolvedValue({ boardMemberId: 9 } as any);
        const res = await request(app).post('/bm/new').set('Authorization', 'Bearer t').send({ title: 'P' });
        expect(res.status).toBe(201);
    });

    it('PATCH /:boardMemberId updates as Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet.mockResolvedValue({ boardMemberId: 2 } as any);
        mockedPatch.mockResolvedValue(undefined as any);
        const res = await request(app).patch('/bm/2').set('Authorization', 'Bearer t').send({ title: 'VP' });
        expect(res.status).toBe(200);
    });

    it('DELETE /:boardMemberId removes as Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet.mockResolvedValue({ boardMemberId: 4 } as any);
        mockedDelete.mockResolvedValue(undefined as any);
        const res = await request(app).delete('/bm/4').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('POST /new returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).post('/bm/new').send({});
        expect(res.status).toBe(401);
    });

    it('POST /new maps user input error to 400', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedInsert.mockRejectedValue(new Error('user input error'));
        const res = await request(app).post('/bm/new').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(400);
    });

    it('GET /list returns 401 when verify fails', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/bm/list?year=2026').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('PATCH /:id returns 404 for NaN id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).patch('/bm/nope').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(404);
    });

    it('PATCH returns 403 when verify throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).patch('/bm/2').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(403);
    });

    it('DELETE returns 401 when verify fails', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).delete('/bm/2').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });
});
