import request from 'supertest';
import { checkHeader, validateAdminAccess } from '../../util/auth';
import {
    deleteDefaultSetting,
    getAllDefaultSettings,
    getDefaultSetting,
    getDefaultSettingValue,
    insertDefaultSetting,
    updateDefaultSetting,
} from '../../database/defaultSettings';
import defaultSetting from '../../api/defaultSetting';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/defaultSettings');
jest.mock('../../util/s3', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(Buffer.from('x')) }));
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedValidate = validateAdminAccess as jest.MockedFunction<typeof validateAdminAccess>;
const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedGetAll = getAllDefaultSettings as jest.MockedFunction<typeof getAllDefaultSettings>;
const mockedGetOne = getDefaultSetting as jest.MockedFunction<typeof getDefaultSetting>;
const mockedUpdate = updateDefaultSetting as jest.MockedFunction<typeof updateDefaultSetting>;
const mockedInsert = insertDefaultSetting as jest.MockedFunction<typeof insertDefaultSetting>;
const mockedDelete = deleteDefaultSetting as jest.MockedFunction<typeof deleteDefaultSetting>;
const mockedGetValue = getDefaultSettingValue as jest.MockedFunction<typeof getDefaultSettingValue>;

describe('api/defaultSetting', () => {
    const app = createJsonRouterApp('/ds', defaultSetting);

    beforeEach(() => {
        jest.clearAllMocks();
        mockedValidate.mockResolvedValue({} as any);
    });

    it('returns all settings for admin', async () => {
        mockedGetAll.mockResolvedValue([] as any);
        const res = await request(app).get('/ds/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetAll).toHaveBeenCalledWith('tenant-test');
    });

    it('returns 401 for admin route when Authorization Failed', async () => {
        mockedValidate.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/ds/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ reason: 'not authorized' });
    });

    it('GET /:settingName uses checkHeader', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetOne.mockResolvedValue({ settingName: 'X' } as any);
        const res = await request(app).get('/ds/SOME_SETTING').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetOne).toHaveBeenCalledWith('SOME_SETTING', 'tenant-test');
    });

    it('GET /applications/enabled uses fixed tenant id in code', async () => {
        mockedGetOne.mockResolvedValue({ enabled: true } as any);
        const res = await request(app).get('/ds/applications/enabled');
        expect(res.status).toBe(200);
        expect(mockedGetOne).toHaveBeenCalledWith(
            'ALLOW_APPLICATIONS',
            'ad6a18d1-d963-11f0-858e-1284e6c74c95',
        );
    });

    it('returns 500 when getAllDefaultSettings throws unexpectedly', async () => {
        mockedGetAll.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/ds/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('PUT /:id updates setting as admin', async () => {
        mockedGetOne.mockResolvedValue({ settingName: 'X', id: 1 } as any);
        mockedUpdate.mockResolvedValue({ settingName: 'X', id: 1 } as any);
        const res = await request(app)
            .put('/ds/1')
            .set('Authorization', 'Bearer t')
            .send({ settingName: 'X', value: 'v' });
        expect(res.status).toBe(200);
    });

    it('POST / creates setting as admin', async () => {
        mockedInsert.mockResolvedValue(undefined as any);
        mockedGetOne.mockResolvedValue({ settingName: 'NEW', id: 2 } as any);
        const res = await request(app)
            .post('/ds/')
            .set('Authorization', 'Bearer t')
            .send({ settingName: 'NEW', value: '1' });
        expect(res.status).toBe(200);
    });

    it('DELETE /:id removes setting as admin', async () => {
        mockedGetValue.mockResolvedValue('old' as any);
        mockedDelete.mockResolvedValue(undefined as any);
        const res = await request(app).delete('/ds/9').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedDelete).toHaveBeenCalledWith(9, 'tenant-test');
    });

    it('GET /admin/databackup returns gzip when header valid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 'tok' });
        const res = await request(app).get('/ds/admin/databackup?id=tok');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/gzip/);
    });

    it('GET /:settingName returns 500 when getDefaultSetting fails', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGetOne.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/ds/X').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });
});
