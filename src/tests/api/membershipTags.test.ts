import request from 'supertest';
import { validateAdminAccess } from '../../util/auth';
import { getUniqueTags } from '../../database/membershipTags';
import membershipTags from '../../api/membershipTags';
import { createRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/membershipTags', () => ({
    getUniqueTags: jest.fn(),
}));

const mockedValidate = validateAdminAccess as jest.MockedFunction<typeof validateAdminAccess>;
const mockedGetUniqueTags = getUniqueTags as jest.MockedFunction<typeof getUniqueTags>;

describe('api/membershipTags', () => {
    const app = createRouterApp('/tags', membershipTags);

    beforeEach(() => {
        jest.clearAllMocks();
        mockedValidate.mockResolvedValue({} as any);
    });

    it('returns unique tags for an admin', async () => {
        mockedGetUniqueTags.mockResolvedValue(['a', 'b'] as any);
        const res = await request(app).get('/tags/unique').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(['a', 'b']);
        expect(mockedGetUniqueTags).toHaveBeenCalledWith('tenant-test');
    });

});
