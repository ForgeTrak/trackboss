import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import { getPool } from '../../database/pool';
import { getLatestBillMembership } from '../../database/billing';
import gateCode from '../../api/gateCode';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/pool');
jest.mock('../../database/billing');

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGetPool = getPool as jest.MockedFunction<typeof getPool>;
const mockedLatestBill = getLatestBillMembership as jest.MockedFunction<typeof getLatestBillMembership>;

describe('api/gateCode', () => {
    const app = createJsonRouterApp('/gc', gateCode);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /latest', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/gc/latest');
            expect(res.status).toBe(401);
        });

        it('returns billing message when insurance not satisfied', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedLatestBill.mockResolvedValue({ curYearIns: false, curYearPaid: true } as any);
            const res = await request(app).get('/gc/latest?membershipId=1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Billing or insurance required');
        });

        it('treats missing membershipId as NaN when checking billing', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedLatestBill.mockResolvedValue({ curYearIns: false, curYearPaid: false } as any);
            const res = await request(app).get('/gc/latest').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(mockedLatestBill.mock.calls[0][0]).toBeNaN();
            expect(mockedLatestBill.mock.calls[0][1]).toBe('tenant-test');
            expect(res.body.message).toBe('Billing or insurance required');
        });

        it('returns gate code from default_settings when billing satisfied', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedLatestBill.mockResolvedValue({ curYearIns: true, curYearPaid: true } as any);
            const mockQuery = jest.fn().mockResolvedValue([[{
                gate_code_id: 1,
                year: 2026,
                gate_code: 'FULL',
            }]]);
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            const res = await request(app).get('/gc/latest?membershipId=1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body.gateCode).toBe('FULL');
        });

        it('returns 404 when latest gate code query is empty', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedLatestBill.mockResolvedValue({ curYearIns: true, curYearPaid: true } as any);
            const mockQuery = jest.fn().mockResolvedValue([[]]);
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            const res = await request(app).get('/gc/latest?membershipId=1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
            expect(res.body.reason).toBe('not found');
        });

        it('returns 404 when getLatestBillMembership throws not found', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedLatestBill.mockRejectedValue(new Error('not found'));
            const res = await request(app).get('/gc/latest?membershipId=1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 500 on unexpected latest errors', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedLatestBill.mockRejectedValue(new Error('db'));
            const res = await request(app).get('/gc/latest?membershipId=1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });

        it('returns 401 when latest path gets Authorization Failed', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedLatestBill.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/gc/latest?membershipId=1').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /:year', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).get('/gc/2026');
            expect(res.status).toBe(401);
        });

        it('returns gate code when pool has row', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockResolvedValue({} as any);
            const mockQuery = jest.fn().mockResolvedValue([[{
                gate_code_id: 1,
                year: 2026,
                gate_code: 'ABC',
            }]]);
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            const res = await request(app).get('/gc/2026').set('Authorization', 'Bearer t');
            expect(res.status).toBe(200);
            expect(res.body.gateCode).toBe('ABC');
        });

        it('returns 404 when year not in database', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockResolvedValue({} as any);
            const mockQuery = jest.fn().mockResolvedValue([[]]);
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            const res = await request(app).get('/gc/1999').set('Authorization', 'Bearer t');
            expect(res.status).toBe(404);
        });

        it('returns 401 when verify fails', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app).get('/gc/2026').set('Authorization', 'Bearer t');
            expect(res.status).toBe(401);
        });

        it('returns 500 on other GET year errors', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockResolvedValue({} as any);
            const mockQuery = jest.fn().mockRejectedValue(new Error('db'));
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            const res = await request(app).get('/gc/2026').set('Authorization', 'Bearer t');
            expect(res.status).toBe(500);
        });
    });

    describe('POST /:year', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).post('/gc/2026').send({ year: 2026, gateCode: 'N' });
            expect(res.status).toBe(401);
        });

        it('inserts and returns gate code for year', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockResolvedValue({} as any);
            const row = [{ gate_code_id: 2, year: 2026, gate_code: 'NEW' }];
            const mockQuery = jest
                .fn()
                .mockResolvedValueOnce([[]] as any) // insert
                .mockResolvedValueOnce([row] as any); // getGateCodeByYear
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            const res = await request(app)
                .post('/gc/2026')
                .set('Authorization', 'Bearer t')
                .send({ year: 2026, gateCode: 'NEW' });
            expect(res.status).toBe(200);
            expect(res.body.gateCode).toBe('NEW');
        });

        it('maps post errors', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            let res = await request(app).post('/gc/2026').set('Authorization', 'Bearer t').send({});
            expect(res.status).toBe(401);
            mockedVerify.mockResolvedValue({} as any);
            const mockQuery = jest.fn().mockResolvedValue([[]]);
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            res = await request(app).post('/gc/2026').set('Authorization', 'Bearer t').send({ year: 2026, gateCode: 'X' });
            expect(res.status).toBe(404);
        });

        it('returns 500 when insert or follow-up query fails unexpectedly', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockResolvedValue({} as any);
            const mockQuery = jest.fn().mockRejectedValue(new Error('db'));
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            const res = await request(app)
                .post('/gc/2026')
                .set('Authorization', 'Bearer t')
                .send({ year: 2026, gateCode: 'N' });
            expect(res.status).toBe(500);
        });
    });

    describe('PUT /:year', () => {
        it('returns 401 when header invalid', async () => {
            mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
            const res = await request(app).put('/gc/2026').send({ year: 2026, gateCode: 'U' });
            expect(res.status).toBe(401);
        });

        it('updates and returns gate code', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockResolvedValue({} as any);
            const row = [{ gate_code_id: 1, year: 2026, gate_code: 'UPD' }];
            const mockQuery = jest
                .fn()
                .mockResolvedValueOnce([[]] as any)
                .mockResolvedValueOnce([row] as any);
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            const res = await request(app)
                .put('/gc/2026')
                .set('Authorization', 'Bearer t')
                .send({ year: 2026, gateCode: 'UPD' });
            expect(res.status).toBe(200);
            expect(res.body.gateCode).toBe('UPD');
        });

        it('returns 401 when verify fails on put', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
            const res = await request(app)
                .put('/gc/2026')
                .set('Authorization', 'Bearer t')
                .send({ year: 2026, gateCode: 'U' });
            expect(res.status).toBe(401);
        });

        it('returns 404 when row missing after update', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockResolvedValue({} as any);
            const mockQuery = jest
                .fn()
                .mockResolvedValueOnce([[]] as any)
                .mockResolvedValueOnce([[]] as any);
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            const res = await request(app)
                .put('/gc/2026')
                .set('Authorization', 'Bearer t')
                .send({ year: 2026, gateCode: 'U' });
            expect(res.status).toBe(404);
        });

        it('returns 500 on unexpected put errors', async () => {
            mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
            mockedVerify.mockResolvedValue({} as any);
            const mockQuery = jest.fn().mockRejectedValue(new Error('db'));
            mockedGetPool.mockReturnValue({ query: mockQuery } as any);
            const res = await request(app)
                .put('/gc/2026')
                .set('Authorization', 'Bearer t')
                .send({ year: 2026, gateCode: 'U' });
            expect(res.status).toBe(500);
        });
    });
});
