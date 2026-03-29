import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    deleteBoardMemberType,
    getBoardMemberType,
    getBoardMemberTypeList,
    insertBoardMemberType,
    patchBoardMemberType,
} from '../../database/boardMemberType';
import boardMemberType from '../../api/boardMemberType';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/boardMemberType');

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedList = getBoardMemberTypeList as jest.MockedFunction<typeof getBoardMemberTypeList>;
const mockedGet = getBoardMemberType as jest.MockedFunction<typeof getBoardMemberType>;
const mockedInsert = insertBoardMemberType as jest.MockedFunction<typeof insertBoardMemberType>;
const mockedPatch = patchBoardMemberType as jest.MockedFunction<typeof patchBoardMemberType>;
const mockedDelete = deleteBoardMemberType as jest.MockedFunction<typeof deleteBoardMemberType>;

function okHeader() {
    mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
}

describe('api/boardMemberType', () => {
    const app = createJsonRouterApp('/bmt', boardMemberType);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /list', () => {
        it('returns 401 without auth on /list', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'missing', token: '' });
            const res = await request(app).get('/bmt/list');
            expect(res.status).toBe(401);
        });

        it('returns list when token verifies', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedList.mockResolvedValue([{ id: 1 }] as any);
            const res = await request(app).get('/bmt/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ id: 1 }]);
        });

        it('returns 401 when verify fails', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/bmt/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 500 on list error', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedList.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/bmt/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('POST /new', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).post('/bmt/new').send({});
            expect(res.status).toBe(401);
        });

        it('creates a board member type as Admin', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedInsert.mockResolvedValue(9);
            mockedGet.mockResolvedValue({ boardMemberTypeId: 9, name: 'President' } as any);
            const res = await request(app)
                .post('/bmt/new')
                .set('Authorization', 'Bearer t')
                .send({ name: 'President' });
            expect(res.status).toBe(201);
            expect(mockedInsert).toHaveBeenCalled();
        });

        it('maps post errors', async () => {
            const verifyErrors: [string, number][] = [
                ['Authorization Failed', 401],
                ['Forbidden', 403],
            ];
            for (const [msg, status] of verifyErrors) {
                jest.clearAllMocks();
                okHeader();
                mockedVerify.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).post('/bmt/new').set('Authorization', 'Bearer t').send({});
                expect(res.status).toBe(status);
            }
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedInsert.mockRejectedValueOnce(new Error('user input error'));
            let res = await request(app).post('/bmt/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(400);
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedInsert.mockRejectedValueOnce(new Error('db'));
            res = await request(app).post('/bmt/new').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(500);
        });
    });

    describe('GET /:boardMemberTypeId', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/bmt/3');
            expect(res.status).toBe(401);
        });

        it('returns 404 for NaN id', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            const res = await request(app).get('/bmt/not-a-number').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns one type', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockResolvedValue({ boardMemberTypeId: 3 } as any);
            const res = await request(app).get('/bmt/3').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
        });

        it('returns 401 when verify fails', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/bmt/3').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 404 when get throws not found', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockRejectedValue(new Error('not found'));
            const res = await request(app).get('/bmt/3').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 500 on other get errors', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/bmt/3').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('PATCH /:boardMemberTypeId', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).patch('/bmt/1').send({});
            expect(res.status).toBe(401);
        });

        it('returns 404 for NaN id', async () => {
            okHeader();
            const res = await request(app).patch('/bmt/bad').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(404);
        });

        it('returns 200 after patch', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGet.mockResolvedValue({ id: 1 } as any);
            mockedPatch.mockResolvedValue(undefined as any);
            const res = await request(app).patch('/bmt/1').set('Authorization', 'Bearer t').send({ name: 'X' });
            expect(res.status).toBe(200);
        });

        it('maps patch errors', async () => {
            const cases: [string, number][] = [
                ['user input error', 400],
                ['not found', 404],
                ['Authorization Failed', 401],
                ['Forbidden', 403],
                ['other', 500],
            ];
            for (const [msg, status] of cases) {
                jest.clearAllMocks();
                okHeader();
                mockedVerify.mockResolvedValue({} as any);
                mockedGet.mockResolvedValueOnce({ id: 2 } as any);
                mockedPatch.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).patch('/bmt/2').set('Authorization', 'Bearer t').send({});
                expect(res.status).toBe(status);
            }
        });
    });

    describe('DELETE /:boardMemberTypeId', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).delete('/bmt/1');
            expect(res.status).toBe(401);
        });

        it('returns 404 for NaN id', async () => {
            okHeader();
            const res = await request(app).delete('/bmt/bad').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 200 after delete', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedDelete.mockResolvedValue(undefined as any);
            const res = await request(app).delete('/bmt/5').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ boardMemberTypeId: 5 });
        });

        it('maps delete errors', async () => {
            const cases: [string, number][] = [
                ['not found', 404],
                ['Authorization Failed', 401],
                ['Forbidden', 403],
                ['other', 500],
            ];
            for (const [msg, status] of cases) {
                jest.clearAllMocks();
                okHeader();
                mockedVerify.mockResolvedValue({} as any);
                mockedDelete.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).delete('/bmt/6').set('Authorization', 'Bearer t');
                expect(res.status).toBe(status);
            }
        });
    });
});
