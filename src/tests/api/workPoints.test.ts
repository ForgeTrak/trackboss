import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    getWorkPointsByMember,
    getWorkPointsByMembership,
    getWorkPointsList,
} from '../../database/workPoints';
import workPoints from '../../api/workPoints';
import { createRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/workPoints');
jest.mock('../../excel/workbookHelper', () => ({
    startWorkbook: jest.fn(() => ({
        getWorksheet: () => ({ columns: [], addRow: jest.fn() }),
        xlsx: { writeBuffer: jest.fn().mockResolvedValue(Buffer.from('')) },
    })),
    formatWorkbook: jest.fn(),
    httpOutputWorkbook: jest.fn((_wb: unknown, res: any) => {
        res.status(200);
        res.end();
    }),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedByMember = getWorkPointsByMember as jest.MockedFunction<typeof getWorkPointsByMember>;
const mockedByMembership = getWorkPointsByMembership as jest.MockedFunction<typeof getWorkPointsByMembership>;
const mockedList = getWorkPointsList as jest.MockedFunction<typeof getWorkPointsList>;

describe('api/workPoints', () => {
    const app = createRouterApp('/wp', workPoints);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 on byMember without auth', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).get('/wp/byMember/1');
        expect(res.status).toBe(401);
    });

    it('returns work points by member', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedByMember.mockResolvedValue({ rows: [] } as any);
        const res = await request(app).get('/wp/byMember/7').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedByMember).toHaveBeenCalledWith(7, new Date().getFullYear(), 'tenant-test');
    });

    it('returns 400 for invalid year query', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app)
            .get('/wp/byMembership/1')
            .query({ year: 'not-a-year' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(400);
    });

    it('returns work points by membership', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedByMembership.mockResolvedValue({ rows: [] } as any);
        const res = await request(app).get('/wp/byMembership/3').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedByMembership).toHaveBeenCalledWith(3, new Date().getFullYear(), 'tenant-test');
    });

    it('returns 404 for non-numeric member id in byMember', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).get('/wp/byMember/x').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('returns 401 when verify fails on byMembership', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/wp/byMembership/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('returns 500 on unexpected byMember errors', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedByMember.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/wp/byMember/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('GET /list/excel returns 200 after building workbook', async () => {
        mockedList.mockResolvedValue([] as any);
        const res = await request(app).get('/wp/list/excel');
        expect(res.status).toBe(200);
    });

    it('GET /list/excel returns 500 when getWorkPointsList fails', async () => {
        mockedList.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/wp/list/excel');
        expect(res.status).toBe(500);
    });
});
