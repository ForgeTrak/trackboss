import request from 'supertest';
import { checkHeader, validateAdminAccess, verify } from '../../util/auth';
import {
    addSquareAttributes,
    discountBill,
    getBill,
    getBillByOrderId,
    getBillList,
    getWorkPointThreshold,
    markContactedAndRenewing,
    markInsuranceAttestation,
} from '../../database/billing';
import { getMembershipList } from '../../database/membership';
import billing from '../../api/billing';
import createPaymentLink from '../../integrations/square';
import { createJsonRouterApp } from './testUtils';
import { generateSquareLinks, processBillPayment, runBillingComplete } from '../../util/billing';
import startBillingJob from '../../jobs/billingJob';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/billing', () => ({
    addSquareAttributes: jest.fn(),
    discountBill: jest.fn(),
    getBill: jest.fn(),
    getBillByOrderId: jest.fn(),
    getBillList: jest.fn(),
    getWorkPointThreshold: jest.fn(),
    markContactedAndRenewing: jest.fn(),
    markInsuranceAttestation: jest.fn(),
}));
jest.mock('../../database/membership');
jest.mock('../../util/billing', () => ({
    generateSquareLinks: jest.fn(),
    processBillPayment: jest.fn(),
    runBillingComplete: jest.fn().mockResolvedValue({ created: 0 }),
}));
jest.mock('../../jobs/billingJob', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../util/email', () => ({ sendInsuranceConfirmEmail: jest.fn() }));
jest.mock('../../integrations/square', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue({ squareUrl: 'https://sq', squareOrderId: 'ord1' }),
}));
jest.mock('../../excel/workbookHelper', () => ({
    startWorkbook: jest.fn(() => ({ workbook: {}, worksheet: { columns: [], addRow: jest.fn() } })),
    formatWorkbook: jest.fn(),
    httpOutputWorkbook: jest.fn((_wb: unknown, res: any) => {
        res.status(200);
        res.end();
    }),
}));
jest.mock('../../util/dateHelper', () => ({ calculateBillingYear: () => 2026 }));
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedValidateAdmin = validateAdminAccess as jest.MockedFunction<typeof validateAdminAccess>;
const mockedThreshold = getWorkPointThreshold as jest.MockedFunction<typeof getWorkPointThreshold>;
const mockedBillList = getBillList as jest.MockedFunction<typeof getBillList>;
const mockedMembershipList = getMembershipList as jest.MockedFunction<typeof getMembershipList>;
const mockedGetBill = getBill as jest.MockedFunction<typeof getBill>;
const mockedGetBillByOrderId = getBillByOrderId as jest.MockedFunction<typeof getBillByOrderId>;
const mockedMarkIns = markInsuranceAttestation as jest.MockedFunction<typeof markInsuranceAttestation>;
const mockedMarkContacted = markContactedAndRenewing as jest.MockedFunction<typeof markContactedAndRenewing>;
const mockedDiscount = discountBill as jest.MockedFunction<typeof discountBill>;
const mockedAddSquare = addSquareAttributes as jest.MockedFunction<typeof addSquareAttributes>;
const mockedProcessPayment = processBillPayment as jest.MockedFunction<typeof processBillPayment>;
const mockedGenLinks = generateSquareLinks as jest.MockedFunction<typeof generateSquareLinks>;
const mockedRunBilling = runBillingComplete as jest.MockedFunction<typeof runBillingComplete>;
const mockedStartBillingJob = startBillingJob as jest.MockedFunction<typeof startBillingJob>;
const mockedCreatePaymentLink = createPaymentLink as jest.MockedFunction<typeof createPaymentLink>;

describe('api/billing', () => {
    const app = createJsonRouterApp('/bill', billing);

    beforeEach(() => {
        jest.clearAllMocks();
        mockedValidateAdmin.mockResolvedValue({} as any);
    });

    it('returns 401 on yearlyWorkPointThreshold without auth', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).get('/bill/yearlyWorkPointThreshold');
        expect(res.status).toBe(401);
    });

    it('returns work point threshold', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedThreshold.mockResolvedValue({ threshold: 10 } as any);
        const res = await request(app).get('/bill/yearlyWorkPointThreshold?year=2026').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedThreshold).toHaveBeenCalledWith(2026, 'tenant-test');
    });

    it('returns bill list', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedBillList.mockResolvedValue([] as any);
        const res = await request(app).get('/bill/list?year=2026&paymentStatus=paid').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedBillList).toHaveBeenCalled();
    });

    it('POST / runs billing as Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).post('/bill/').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(201);
        expect(mockedStartBillingJob).toHaveBeenCalled();
    });

    it('GET /:membershipID returns bills for Member role', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedBillList.mockResolvedValue([] as any);
        const res = await request(app).get('/bill/12').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('POST /:billId pays bill as Membership Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetBill.mockResolvedValue({ billId: 3, amount: 10 } as any);
        mockedProcessPayment.mockResolvedValue(undefined as any);
        const res = await request(app)
            .post('/bill/3')
            .query({ paymentMethod: 'Check' })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PATCH /attestIns/:billId marks insurance and emails when newly attested', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetBill
            .mockResolvedValueOnce({ billId: 1, curYearIns: false, amount: 10 } as any)
            .mockResolvedValueOnce({ billId: 1, curYearIns: true, amount: 10 } as any);
        mockedMarkIns.mockResolvedValue(undefined as any);
        const res = await request(app).patch('/bill/attestIns/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PATCH /attestIns skips markInsurance when already insured', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetBill.mockResolvedValue({ billId: 3, curYearIns: true, amount: 5 } as any);
        const res = await request(app).patch('/bill/attestIns/3').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedMarkIns).not.toHaveBeenCalled();
        expect(mockedGetBill.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('PATCH /attestIns/:billId marks contacted when amount is zero', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetBill
            .mockResolvedValueOnce({ billId: 2, curYearIns: false, amount: 0 } as any)
            .mockResolvedValueOnce({ billId: 2, curYearIns: true, amount: 0 } as any);
        mockedMarkIns.mockResolvedValue(undefined as any);
        mockedMarkContacted.mockResolvedValue(undefined as any);
        const res = await request(app).patch('/bill/attestIns/2').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PATCH /markContacted/:billId updates bill', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetBill.mockResolvedValue({ billId: 4 } as any);
        mockedMarkContacted.mockResolvedValue(undefined as any);
        const res = await request(app).patch('/bill/markContacted/4').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PATCH /discount/:billId applies discount and square link', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetBill
            .mockResolvedValueOnce({ billId: 5, amount: 100, amountWithFee: 105 } as any)
            .mockResolvedValueOnce({ billId: 5, amount: 50, amountWithFee: 52 } as any);
        mockedDiscount.mockResolvedValue(undefined as any);
        mockedAddSquare.mockResolvedValue(undefined as any);
        const res = await request(app).patch('/bill/discount/5').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('GET /list/excel returns workbook for admin', async () => {
        mockedBillList.mockResolvedValue([
            {
                lastName: 'L',
                firstName: 'F',
                pointsEarned: 1,
                amount: 10,
                membershipType: 'Full',
                curYearIns: true,
                curYearPaid: false,
            },
            {
                lastName: 'M',
                firstName: 'G',
                pointsEarned: 0,
                amount: 0,
                membershipType: 'Assoc',
                curYearIns: false,
                curYearPaid: true,
            },
        ] as any);
        const res = await request(app).get('/bill/list/excel?year=2026').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PUT /create/checkoutlinks returns generated links', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGenLinks.mockResolvedValue([] as any);
        const res = await request(app)
            .put('/bill/create/checkoutlinks')
            .query({ membershipId: 1, year: 2026 })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('POST /webhook/incoming ignores unknown order id', async () => {
        mockedGetBillByOrderId.mockResolvedValue(null as any);
        const res = await request(app)
            .post('/bill/webhook/incoming')
            .send({ data: { object: { payment: { order_id: 'unknown', total_money: { amount: 0 }, status: 'COMPLETED' } } } });
        expect(res.status).toBe(200);
    });

    it('POST /webhook/incoming ignores duplicate when bill already paid', async () => {
        mockedGetBillByOrderId.mockResolvedValue({
            billId: 11,
            tenantId: 'tenant-test',
            curYearPaid: true,
            amountWithFee: 10,
            squareOrderId: 'sq2',
            membershipAdmin: 'a@b.com',
        } as any);
        const res = await request(app)
            .post('/bill/webhook/incoming')
            .send({
                data: {
                    object: {
                        payment: {
                            order_id: 'sq2',
                            total_money: { amount: 1000 },
                            status: 'COMPLETED',
                        },
                    },
                },
            });
        expect(res.status).toBe(200);
    });

    it('POST /webhook/incoming processes payment for known order', async () => {
        mockedGetBillByOrderId.mockResolvedValue({
            billId: 9,
            tenantId: 'tenant-test',
            curYearPaid: false,
            amountWithFee: 50,
            squareOrderId: 'sq1',
            membershipAdmin: 'a@b.com',
        } as any);
        mockedProcessPayment.mockResolvedValue({} as any);
        const res = await request(app)
            .post('/bill/webhook/incoming')
            .send({
                data: {
                    object: {
                        payment: {
                            order_id: 'sq1',
                            total_money: { amount: 5000 },
                            status: 'COMPLETED',
                        },
                    },
                },
            });
        expect(res.status).toBe(200);
    });

    it('yearlyWorkPointThreshold returns 401 when verify fails', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/bill/yearlyWorkPointThreshold').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('bill list returns 403 when getBillList throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedBillList.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).get('/bill/list?year=2026').set('Authorization', 'Bearer t');
        expect(res.status).toBe(403);
    });

    it('GET membership bills returns 404 for NaN membership id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).get('/bill/notnum').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('POST pay returns 404 for NaN bill id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).post('/bill/nan').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('POST billing run returns 401 when verify fails', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).post('/bill/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('yearlyWorkPointThreshold defaults year when query is missing or NaN', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedThreshold.mockResolvedValue({ threshold: 1 } as any);
        const y = new Date().getFullYear();
        let res = await request(app).get('/bill/yearlyWorkPointThreshold').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedThreshold).toHaveBeenCalledWith(y, 'tenant-test');
        mockedThreshold.mockClear();
        res = await request(app).get('/bill/yearlyWorkPointThreshold?year=abc').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedThreshold).toHaveBeenCalledWith(y, 'tenant-test');
    });

    it('yearlyWorkPointThreshold returns 500 on unexpected errors', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedThreshold.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/bill/yearlyWorkPointThreshold').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('GET /list returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'bad', token: '' });
        const res = await request(app).get('/bill/list').set('Authorization', 'Bearer x');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ reason: 'bad' });
    });

    it('GET /list uses calculated billing year when year omitted', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedBillList.mockResolvedValue([] as any);
        const res = await request(app).get('/bill/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedBillList).toHaveBeenCalledWith(
            expect.objectContaining({ year: 2026, membershipStatus: 'active' }),
            'tenant-test',
        );
    });

    it('GET /list returns 500 when getBillList throws', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedBillList.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/bill/list?year=2026').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('GET /list returns 401 when getBillList throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedBillList.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/bill/list?year=2026').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('GET /:membershipID returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'nope', token: '' });
        const res = await request(app).get('/bill/9').set('Authorization', 'Bearer x');
        expect(res.status).toBe(401);
    });

    it('GET /:membershipID returns 403 when verify throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).get('/bill/9').set('Authorization', 'Bearer t');
        expect(res.status).toBe(403);
    });

    it('GET /:membershipID returns 500 when getBillList throws', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedBillList.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/bill/9').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('POST /:billId returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'bad', token: '' });
        const res = await request(app).post('/bill/1').set('Authorization', 'Bearer x');
        expect(res.status).toBe(401);
    });

    it('POST /:billId returns 403 when verify throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).post('/bill/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(403);
    });

    it('POST /:billId returns 500 when processBillPayment throws', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetBill.mockResolvedValue({ billId: 1 } as any);
        mockedProcessPayment.mockRejectedValue(new Error('square'));
        const res = await request(app).post('/bill/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('POST / returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'bad', token: '' });
        const res = await request(app).post('/bill/').set('Authorization', 'Bearer x');
        expect(res.status).toBe(401);
    });

    it('POST / returns 403 when verify throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).post('/bill/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(403);
    });

    it('POST / returns 500 when startBillingJob throws', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedStartBillingJob.mockRejectedValue(new Error('billing failed'));
        const res = await request(app).post('/bill/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('PATCH /attestIns/:billId returns 404 for NaN bill id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).patch('/bill/attestIns/notnum').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('PATCH /attestIns returns 403 when verify throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).patch('/bill/attestIns/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(403);
    });

    it('PATCH /markContacted/:billId returns 404 for NaN bill id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).patch('/bill/markContacted/bad').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('PATCH /discount/:billId returns 404 for NaN bill id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).patch('/bill/discount/xyz').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('PATCH /discount returns 500 when createPaymentLink fails', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetBill.mockResolvedValue({ billId: 6, amount: 20, amountWithFee: 22 } as any);
        mockedDiscount.mockResolvedValue(undefined as any);
        mockedCreatePaymentLink.mockRejectedValueOnce(new Error('square api'));
        const res = await request(app).patch('/bill/discount/6').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('GET /list/excel returns 500 when validateAdminAccess fails', async () => {
        mockedValidateAdmin.mockRejectedValue(new Error('not admin'));
        const res = await request(app).get('/bill/list/excel').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('PUT /create/checkoutlinks returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'bad hdr', token: '' });
        const res = await request(app).put('/bill/create/checkoutlinks').set('Authorization', 'Bearer x');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ reason: 'bad hdr' });
    });

    it('PUT /create/checkoutlinks uses calculated year when year omitted', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGenLinks.mockResolvedValue([{ billId: 1 }] as any);
        const res = await request(app).put('/bill/create/checkoutlinks').query({ membershipId: 3 }).set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGenLinks).toHaveBeenCalledWith(2026, 3);
    });

    it('PUT /create/checkoutlinks returns 500 when generateSquareLinks throws', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedGenLinks.mockRejectedValue(new Error('link gen failed'));
        const res = await request(app)
            .put('/bill/create/checkoutlinks')
            .query({ membershipId: 1, year: 2025 })
            .set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('POST /webhook/incoming processes payment when status is not COMPLETED', async () => {
        mockedGetBillByOrderId.mockResolvedValue({
            billId: 12,
            tenantId: 'tenant-test',
            curYearPaid: false,
            amountWithFee: 40,
            squareOrderId: 'sq-pend',
            membershipAdmin: 'm@x.com',
        } as any);
        mockedProcessPayment.mockResolvedValue({ updated: true } as any);
        const res = await request(app)
            .post('/bill/webhook/incoming')
            .send({
                data: {
                    object: {
                        payment: {
                            order_id: 'sq-pend',
                            total_money: { amount: 4000 },
                            status: 'PENDING',
                        },
                    },
                },
            });
        expect(res.status).toBe(200);
        expect(mockedProcessPayment).toHaveBeenCalledWith(12, 'Square', 'tenant-test');
    });

    it('POST /webhook/incoming returns 500 when getBillByOrderId throws', async () => {
        mockedGetBillByOrderId.mockRejectedValue(new Error('db'));
        const res = await request(app)
            .post('/bill/webhook/incoming')
            .send({
                data: { object: { payment: { order_id: 'x', total_money: { amount: 0 }, status: 'COMPLETED' } } },
            });
        expect(res.status).toBe(500);
    });

    it('GET /:membershipID returns 401 when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).get('/bill/8').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('POST /:billId returns 401 when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).post('/bill/3').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('PATCH /attestIns returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'no', token: '' });
        const res = await request(app).patch('/bill/attestIns/1').set('Authorization', 'Bearer x');
        expect(res.status).toBe(401);
    });

    it('PATCH /attestIns returns 401 when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).patch('/bill/attestIns/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('PATCH /attestIns returns 500 when getBill throws', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetBill.mockRejectedValue(new Error('db'));
        const res = await request(app).patch('/bill/attestIns/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('PATCH /markContacted returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'no', token: '' });
        const res = await request(app).patch('/bill/markContacted/1').set('Authorization', 'Bearer x');
        expect(res.status).toBe(401);
    });

    it('PATCH /markContacted returns 401 when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).patch('/bill/markContacted/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('PATCH /markContacted returns 403 when verify throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).patch('/bill/markContacted/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(403);
    });

    it('PATCH /markContacted returns 500 when getBill throws', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetBill.mockRejectedValue(new Error('db'));
        const res = await request(app).patch('/bill/markContacted/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('PATCH /discount returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'no', token: '' });
        const res = await request(app).patch('/bill/discount/1').set('Authorization', 'Bearer x');
        expect(res.status).toBe(401);
    });

    it('PATCH /discount returns 401 when verify throws Authorization Failed', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Authorization Failed'));
        const res = await request(app).patch('/bill/discount/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(401);
    });

    it('PATCH /discount returns 403 when verify throws Forbidden', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValue(new Error('Forbidden'));
        const res = await request(app).patch('/bill/discount/1').set('Authorization', 'Bearer t');
        expect(res.status).toBe(403);
    });

    it('GET /list/excel uses calculated year when year query omitted', async () => {
        mockedBillList.mockResolvedValue([] as any);
        const res = await request(app).get('/bill/list/excel').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedBillList).toHaveBeenCalledWith(
            expect.objectContaining({ year: 2026 }),
            'tenant-test',
        );
    });

    it('GET /list/excel returns 500 when getBillList throws', async () => {
        mockedBillList.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/bill/list/excel?year=2026').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });
});
