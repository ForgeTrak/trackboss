jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    addSquareAttributes,
    cleanBilling,
    discountBill,
    generateBill,
    getBill,
    getBillByOrderId,
    getBillList,
    getLatestBillMembership,
    getWorkPointThreshold,
    markBillPaid,
    markContactedAndRenewing,
    markInsuranceAttestation,
} from '../../database/billing';

describe('database/billing', () => {
    beforeEach(() => mockQuery.mockReset());

    const billRow = (over: Record<string, unknown> = {}) => ({
        bill_id: 1,
        tenant_id: 't',
        generated_date: '2026-01-01',
        year: 2026,
        amount: 100,
        amount_with_fee: 103,
        membership_admin: 'a@b.com',
        membership_id: 9,
        first_name: 'F',
        last_name: 'L',
        membership_admin_email: 'a@b.com',
        phone_number: '1',
        membership_type: 'Full',
        emailed_bill: 0,
        cur_year_paid: Buffer.from([0]),
        cur_year_ins: Buffer.from([0]),
        points_earned: 5,
        threshold: 10,
        payment_method: null,
        square_link: null,
        square_order_id: null,
        renewal_contacted: 0,
        work_detail: '{}',
        status: 'active',
        ...over,
    });

    it('generateBill returns insertId', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 7 } as any]);
        await expect(
            generateBill(
                {
                    billingYear: 2026,
                    amount: 10,
                    amountWithFee: 11,
                    membershipId: 1,
                    pointsThreshold: 10,
                    pointsEarned: 0,
                    workDetail: [],
                } as any,
                't',
            ),
        ).resolves.toBe(7);
    });

    it('getWorkPointThreshold returns threshold', async () => {
        mockQuery.mockResolvedValueOnce([[{ year: 2026, amount: 8 }]]);
        await expect(getWorkPointThreshold(2026, 't')).resolves.toEqual({ year: 2026, threshold: 8 });
    });

    it('getBillList with filters builds dynamic SQL', async () => {
        mockQuery.mockResolvedValueOnce([[billRow()]]);
        const list = await getBillList({ year: 2026, paymentStatus: 'paid', membershipStatus: 'active' }, 't');
        expect(list[0].billId).toBe(1);
    });

    it('getBillList without filters', async () => {
        mockQuery.mockResolvedValueOnce([[billRow()]]);
        const list = await getBillList({}, 't');
        expect(list).toHaveLength(1);
    });

    it('markBillPaid and markInsuranceAttestation and markContactedAndRenewing query', async () => {
        mockQuery.mockResolvedValue([{ affectedRows: 1 } as any]);
        await expect(markBillPaid(1, 'Check', 't')).resolves.toBeUndefined();
        await expect(markInsuranceAttestation(1, 't')).resolves.toBeUndefined();
        await expect(markContactedAndRenewing(1, 't')).resolves.toBeUndefined();
    });

    it('discountBill and addSquareAttributes run updates', async () => {
        mockQuery.mockResolvedValue([{ affectedRows: 1 } as any]);
        await expect(discountBill(1, 50, 52, 't')).resolves.toBeUndefined();
        await expect(addSquareAttributes({ billId: 1 } as any, 't')).resolves.toBeUndefined();
    });

    it('cleanBilling returns affected row count', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 3 } as any]);
        await expect(cleanBilling(2026, undefined, 't')).resolves.toBe(3);
    });

    it('getBill maps row', async () => {
        mockQuery.mockResolvedValueOnce([[billRow()]]);
        const b = await getBill(1, 't');
        expect(b.billId).toBe(1);
    });

    it('getBillByOrderId returns empty object when not found', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(getBillByOrderId('sq')).resolves.toEqual({});
    });

    it('getLatestBillMembership returns bill', async () => {
        mockQuery.mockResolvedValueOnce([[billRow()]]);
        const b = await getLatestBillMembership(9, 't');
        expect(b.membershipId).toBe(9);
    });
});
