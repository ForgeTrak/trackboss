import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    getMembership,
    getMembershipList,
    insertMembership,
    patchMembership,
} from '../../database/membership';
import {
    createMembershipTag,
    deleteMembershipTag,
    getMembershipTags,
} from '../../database/membershipTags';
import membership from '../../api/membership';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/membership');
jest.mock('../../database/membershipTags', () => ({
    cleanMembershipTags: jest.fn(),
    createMembershipTag: jest.fn(),
    deleteMembershipTag: jest.fn(),
    getMembershipTags: jest.fn(),
}));
jest.mock('../../util/billing', () => ({ runBillingCompleteCurrent: jest.fn() }));
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGetList = getMembershipList as jest.MockedFunction<typeof getMembershipList>;
const mockedGet = getMembership as jest.MockedFunction<typeof getMembership>;
const mockedInsert = insertMembership as jest.MockedFunction<typeof insertMembership>;
const mockedPatch = patchMembership as jest.MockedFunction<typeof patchMembership>;
const mockedGetTags = getMembershipTags as jest.MockedFunction<typeof getMembershipTags>;
const mockedCreateTag = createMembershipTag as jest.MockedFunction<typeof createMembershipTag>;
const mockedDeleteTag = deleteMembershipTag as jest.MockedFunction<typeof deleteMembershipTag>;

describe('api/membership', () => {
    const app = createJsonRouterApp('/ms', membership);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 on /list without auth', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).get('/ms/list');
        expect(res.status).toBe(401);
    });

    it('returns membership list', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetList.mockResolvedValue([] as any);
        const res = await request(app).get('/ms/list?status=active').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetList).toHaveBeenCalledWith('active', 'tenant-test');
    });

    it('returns one membership', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet.mockResolvedValue({ membershipId: 4 } as any);
        const res = await request(app).get('/ms/4').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGet).toHaveBeenCalledWith(4, 'tenant-test');
    });

    it('POST /new creates membership as Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedInsert.mockResolvedValue(8);
        mockedGet.mockResolvedValue({ membershipId: 8 } as any);
        const res = await request(app).post('/ms/new').set('Authorization', 'Bearer t').send({ name: 'N' });
        expect(res.status).toBe(201);
    });

    it('PATCH /:id updates as Membership Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet
            .mockResolvedValueOnce({ membershipId: 5, membershipType: 'Full Member' } as any)
            .mockResolvedValueOnce({ membershipId: 5, membershipType: 'Associate Member' } as any);
        mockedPatch.mockResolvedValue(undefined as any);
        const res = await request(app).patch('/ms/5').set('Authorization', 'Bearer t').send({ note: 'x' });
        expect(res.status).toBe(200);
    });

    it('POST /tags creates tags', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetTags.mockResolvedValue([] as any);
        mockedCreateTag.mockResolvedValue([{ id: 1 }] as any);
        const res = await request(app)
            .post('/ms/tags')
            .set('Authorization', 'Bearer t')
            .send({ membershipId: 1, tags: ['t'] });
        expect(res.status).toBe(200);
    });

    it('GET /tags/:membershipID returns tags', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetTags.mockResolvedValue([] as any);
        const res = await request(app).get('/ms/tags/2').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('DELETE /tags removes tags', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetTags.mockResolvedValue([] as any);
        mockedDeleteTag.mockResolvedValue([] as any);
        const res = await request(app)
            .delete('/ms/tags')
            .set('Authorization', 'Bearer t')
            .send({ membershipId: 2, tags: ['x'] });
        expect(res.status).toBe(200);
    });

    it('POST /new returns 401 without auth', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).post('/ms/new').send({});
        expect(res.status).toBe(401);
    });

    it('GET /:id returns 404 when not found', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet.mockRejectedValue(new Error('not found'));
        const res = await request(app).get('/ms/404').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('GET /list returns 401 when verify fails', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/ms/list?status=active').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('PATCH returns 400 on user input error', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet.mockResolvedValue({ membershipId: 6, membershipType: 'A' } as any);
        mockedPatch.mockRejectedValue(new Error('user input error'));
        const res = await request(app).patch('/ms/6').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(400);
    });

    it('POST /tags returns 404 when not found', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetTags.mockResolvedValue([] as any);
        mockedCreateTag.mockRejectedValue(new Error('not found'));
        const res = await request(app)
            .post('/ms/tags')
            .set('Authorization', 'Bearer t')
            .send({ membershipId: 1, tags: ['t'] });
        expect(res.status).toBe(404);
    });
});
