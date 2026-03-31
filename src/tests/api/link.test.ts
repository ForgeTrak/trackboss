import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import { getLinks } from '../../database/link';
import link from '../../api/link';
import { createRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/link');

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGetLinks = getLinks as jest.MockedFunction<typeof getLinks>;

describe('api/link', () => {
    const app = createRouterApp('/link', link);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 when the header is invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'no token', token: '' });
        const res = await request(app).get('/link/list');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ reason: 'no token' });
    });

    it('returns 200 with links when authorized', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetLinks.mockResolvedValue([{ linkId: 1 }] as any);
        const res = await request(app).get('/link/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ linkId: 1 }]);
        expect(mockedGetLinks).toHaveBeenCalledWith('tenant-test');
    });

    it('returns 401 when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/link/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ reason: 'not authorized' });
    });

    it('returns 500 when getLinks fails', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetLinks.mockRejectedValue(new Error('db down'));
        const res = await request(app).get('/link/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ reason: 'internal server error' });
    });
});
