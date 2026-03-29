import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    getMemberType,
    getMemberTypeList,
    getMembershipTypeCounts,
    patchMemberType,
} from '../../database/memberType';
import memberType from '../../api/memberType';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/memberType');
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedList = getMemberTypeList as jest.MockedFunction<typeof getMemberTypeList>;
const mockedCounts = getMembershipTypeCounts as jest.MockedFunction<typeof getMembershipTypeCounts>;
const mockedGet = getMemberType as jest.MockedFunction<typeof getMemberType>;
const mockedPatch = patchMemberType as jest.MockedFunction<typeof patchMemberType>;

describe('api/memberType', () => {
    const app = createJsonRouterApp('/mt', memberType);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 on /list without auth', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).get('/mt/list');
        expect(res.status).toBe(401);
    });

    it('returns member types', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedList.mockResolvedValue([] as any);
        const res = await request(app).get('/mt/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedList).toHaveBeenCalledWith('tenant-test');
    });

    it('returns membership counts', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedCounts.mockResolvedValue([] as any);
        const res = await request(app).get('/mt/membershipCounts').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('returns 401 on membershipCounts when verify fails', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/mt/membershipCounts').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('GET /:memberTypeID returns one type', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet.mockResolvedValue({ memberTypeId: 1 } as any);
        const res = await request(app).get('/mt/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PATCH /:memberTypeID updates as Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet.mockResolvedValue({ memberTypeId: 1 } as any);
        mockedPatch.mockResolvedValue(undefined as any);
        const res = await request(app).patch('/mt/1').set('Authorization', 'Bearer t').send({ title: 'T' });
        expect(res.status).toBe(200);
    });

    it('GET /list returns 500 on unexpected errors', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedList.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/mt/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('GET /:memberTypeID returns 404 when not found', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet.mockRejectedValue(new Error('not found'));
        const res = await request(app).get('/mt/99').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('PATCH maps user input error to 400', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGet.mockResolvedValue({ memberTypeId: 2 } as any);
        mockedPatch.mockRejectedValue(new Error('user input error'));
        const res = await request(app).patch('/mt/2').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(400);
    });
});
