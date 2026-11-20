import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    createLink,
    deleteLinkById,
    getAllLinks,
    getLinkById,
    getLinks,
    updateLink,
} from '../../database/link';
import link from '../../api/link';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/link');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGetLinks = getLinks as jest.MockedFunction<typeof getLinks>;
const mockedGetAllLinks = getAllLinks as jest.MockedFunction<typeof getAllLinks>;
const mockedGetById = getLinkById as jest.MockedFunction<typeof getLinkById>;
const mockedCreate = createLink as jest.MockedFunction<typeof createLink>;
const mockedUpdate = updateLink as jest.MockedFunction<typeof updateLink>;
const mockedDelete = deleteLinkById as jest.MockedFunction<typeof deleteLinkById>;

function okHeader() {
    mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
}

describe('api/link', () => {
    const app = createJsonRouterApp('/link', link);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /list', () => {
        it('returns 401 when the header is invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'no token', token: '' });
            const res = await request(app).get('/link/list');
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ reason: 'no token' });
        });

        it('returns 200 with links when authorized', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetLinks.mockResolvedValue([{ linkId: 1 }] as any);
            const res = await request(app).get('/link/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ linkId: 1 }]);
            expect(mockedGetLinks).toHaveBeenCalledWith('tenant-test');
        });

        it('returns 401 when verify throws Authorization Failed', async () => {
            okHeader();
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/link/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ reason: 'not authorized' });
        });

        it('returns 500 when getLinks fails', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetLinks.mockRejectedValue(new Error('db down'));
            const res = await request(app).get('/link/list').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ reason: 'internal server error' });
        });
    });

    describe('GET /all', () => {
        it('returns 401 when header is invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'no token', token: '' });
            const res = await request(app).get('/link/all');
            expect(res.status).toBe(401);
        });

        it('returns 200 with all links as Admin', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetAllLinks.mockResolvedValue([{ linkId: 1, online: false }] as any);
            const res = await request(app).get('/link/all').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ linkId: 1, online: false }]);
            expect(mockedVerify).toHaveBeenCalledWith('t', 'Admin');
            expect(mockedGetAllLinks).toHaveBeenCalledWith('tenant-test');
        });

        it('maps GET /all errors', async () => {
            const cases: [string, number][] = [
                ['Authorization Failed', 401],
                ['Forbidden', 403],
                ['other', 500],
            ];
            for (const [msg, status] of cases) {
                jest.clearAllMocks();
                okHeader();
                mockedVerify.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).get('/link/all').set('Authorization', 'Bearer t');
                expect(res.status).toBe(status);
            }
        });
    });

    describe('GET /:linkId', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/link/1');
            expect(res.status).toBe(401);
        });

        it('returns 404 when id is NaN', async () => {
            okHeader();
            const res = await request(app).get('/link/bad').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns one link', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetById.mockResolvedValue({ linkId: 1 } as any);
            const res = await request(app).get('/link/1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ linkId: 1 });
        });

        it('maps GET /:linkId errors', async () => {
            const cases: [string, number][] = [
                ['not found', 404],
                ['Authorization Failed', 401],
                ['other', 500],
            ];
            for (const [msg, status] of cases) {
                jest.clearAllMocks();
                okHeader();
                mockedVerify.mockResolvedValue({} as any);
                mockedGetById.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).get('/link/1').set('Authorization', 'Bearer t');
                expect(res.status).toBe(status);
            }
        });
    });

    describe('POST /', () => {
        const validBody = { linkTitle: 'Rules', linkUrl: 'https://x.com', linkDisplayOrder: 1 };

        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).post('/link/').send(validBody);
            expect(res.status).toBe(401);
        });

        it('returns 400 when linkUrl is invalid', async () => {
            okHeader();
            const res = await request(app)
                .post('/link/')
                .set('Authorization', 'Bearer t')
                .send({ linkTitle: 'Rules', linkUrl: 'not-a-url' });
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ reason: 'bad request' });
        });

        it('creates link as Admin', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedCreate.mockResolvedValue({ linkId: 1, linkTitle: 'Rules' } as any);
            const res = await request(app)
                .post('/link/')
                .set('Authorization', 'Bearer t')
                .send(validBody);
            expect(res.status).toBe(200);
            expect(mockedCreate).toHaveBeenCalledWith(
                validBody,
                'tenant-test',
            );
        });

        it('maps post errors', async () => {
            const verifyCases: [string, number][] = [
                ['Authorization Failed', 401],
                ['Forbidden', 403],
            ];
            for (const [msg, status] of verifyCases) {
                jest.clearAllMocks();
                okHeader();
                mockedVerify.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).post('/link/').set('Authorization', 'Bearer t').send(validBody);
                expect(res.status).toBe(status);
            }
            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedCreate.mockRejectedValueOnce(new Error('not found'));
            let res = await request(app).post('/link/').set('Authorization', 'Bearer t').send(validBody);
            expect(res.status).toBe(404);

            jest.clearAllMocks();
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedCreate.mockRejectedValueOnce(new Error('db'));
            res = await request(app).post('/link/').set('Authorization', 'Bearer t').send(validBody);
            expect(res.status).toBe(500);
        });
    });

    describe('PATCH /:linkId', () => {
        const validPatch = { linkTitle: 'Updated', linkUrl: 'https://example.com' };

        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).patch('/link/1').send(validPatch);
            expect(res.status).toBe(401);
        });

        it('returns 404 when id is NaN', async () => {
            okHeader();
            const res = await request(app).patch('/link/bad').set('Authorization', 'Bearer t').send(validPatch);
            expect(res.status).toBe(404);
        });

        it('returns 400 when linkUrl is invalid', async () => {
            okHeader();
            const res = await request(app)
                .patch('/link/2')
                .set('Authorization', 'Bearer t')
                .send({ linkTitle: 'Updated', linkUrl: 'ftp://bad' });
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ reason: 'bad request' });
        });

        it('returns 200 after update', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetById.mockResolvedValue({ linkId: 2 } as any);
            mockedUpdate.mockResolvedValue({ linkId: 2 } as any);
            const res = await request(app)
                .patch('/link/2')
                .set('Authorization', 'Bearer t')
                .send(validPatch);
            expect(res.status).toBe(200);
        });

        it('maps patch errors', async () => {
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
                mockedGetById.mockResolvedValueOnce({ linkId: 3 } as any);
                mockedUpdate.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).patch('/link/3').set('Authorization', 'Bearer t').send(validPatch);
                expect(res.status).toBe(status);
            }
        });
    });

    describe('DELETE /:linkId', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).delete('/link/1');
            expect(res.status).toBe(401);
        });

        it('returns 404 when id is NaN', async () => {
            okHeader();
            const res = await request(app).delete('/link/bad').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 200 after delete', async () => {
            okHeader();
            mockedVerify.mockResolvedValue({} as any);
            mockedGetById.mockResolvedValue({ linkId: 4 } as any);
            mockedDelete.mockResolvedValue({ linkId: 4 });
            const res = await request(app).delete('/link/4').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ linkId: 4 });
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
                mockedGetById.mockResolvedValueOnce({ linkId: 5 } as any);
                mockedDelete.mockRejectedValueOnce(new Error(msg));
                // eslint-disable-next-line no-await-in-loop
                const res = await request(app).delete('/link/5').set('Authorization', 'Bearer t');
                expect(res.status).toBe(status);
            }
        });
    });
});
