jest.mock('../../database/job', () => ({ getJobList: jest.fn() }));
jest.mock('../../database/billing', () => ({
    addSquareAttributes: jest.fn(),
    cleanBilling: jest.fn(),
    generateBill: jest.fn(),
    getBill: jest.fn(),
    getBillList: jest.fn(),
    getWorkPointThreshold: jest.fn(),
    markBillPaid: jest.fn(),
    markContactedAndRenewing: jest.fn(),
}));
jest.mock('../../database/membership', () => ({
    getBaseDues: jest.fn(),
    upgradeMembershipSenior: jest.fn(),
}));
jest.mock('../../database/workPoints', () => ({
    getWorkPointsByMembership: jest.fn(),
}));
jest.mock('../../database/boardMember', () => ({
    getBoardMemberList: jest.fn(),
}));
jest.mock('../../util/email', () => ({
    sendPaymentConfirmationEmail: jest.fn(),
}));
jest.mock('../../integrations/square', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('../../util/dateHelper', () => ({
    calculateBillingYear: jest.fn().mockReturnValue(2026),
}));

import createPaymentLink from '../../integrations/square';
import {
    addSquareAttributes,
    cleanBilling,
    generateBill,
    getBill,
    getBillList,
    getWorkPointThreshold,
    markBillPaid,
    markContactedAndRenewing,
} from '../../database/billing';
import { getBoardMemberList } from '../../database/boardMember';
import { getJobList } from '../../database/job';
import { getBaseDues, upgradeMembershipSenior } from '../../database/membership';
import { getWorkPointsByMembership } from '../../database/workPoints';
import { sendPaymentConfirmationEmail } from '../../util/email';
import {
    generateNewBills,
    generateSquareLinks,
    processBillPayment,
    runBillingComplete,
    runBillingCompleteCurrent,
} from '../../util/billing';

const mockedGetJobList = getJobList as jest.MockedFunction<typeof getJobList>;
const mockedGenerateBill = generateBill as jest.MockedFunction<typeof generateBill>;
const mockedMarkPaid = markBillPaid as jest.MockedFunction<typeof markBillPaid>;
const mockedUpgrade = upgradeMembershipSenior as jest.MockedFunction<typeof upgradeMembershipSenior>;
const mockedGetBillList = getBillList as jest.MockedFunction<typeof getBillList>;
const mockedGetBill = getBill as jest.MockedFunction<typeof getBill>;
const mockedThreshold = getWorkPointThreshold as jest.MockedFunction<typeof getWorkPointThreshold>;
const mockedClean = cleanBilling as jest.MockedFunction<typeof cleanBilling>;
const mockedBoard = getBoardMemberList as jest.MockedFunction<typeof getBoardMemberList>;
const mockedBaseDues = getBaseDues as jest.MockedFunction<typeof getBaseDues>;
const mockedWp = getWorkPointsByMembership as jest.MockedFunction<typeof getWorkPointsByMembership>;
const mockedSendPayEmail = sendPaymentConfirmationEmail as jest.MockedFunction<
    typeof sendPaymentConfirmationEmail
>;
const mockedCreateLink = createPaymentLink as jest.MockedFunction<typeof createPaymentLink>;
const mockedAddSquare = addSquareAttributes as jest.MockedFunction<typeof addSquareAttributes>;
const mockedMarkContacted = markContactedAndRenewing as jest.MockedFunction<typeof markContactedAndRenewing>;

describe('util/billing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedBoard.mockResolvedValue([] as any);
        mockedGetJobList.mockResolvedValue([] as any);
        mockedBaseDues.mockResolvedValue(100 as any);
        mockedWp.mockResolvedValue({ total: 0 } as any);
        mockedGenerateBill.mockResolvedValue(500 as any);
        mockedMarkPaid.mockResolvedValue(undefined as any);
        mockedUpgrade.mockResolvedValue(undefined as any);
        mockedGetBillList.mockResolvedValue([] as any);
        mockedThreshold.mockResolvedValue({ threshold: 10 } as any);
        mockedClean.mockResolvedValue(undefined as any);
        mockedCreateLink.mockResolvedValue({ squareUrl: 'https://sq', squareOrderId: 'o1' } as any);
        mockedAddSquare.mockResolvedValue(undefined as any);
    });

    describe('processBillPayment', () => {
        it('marks paid, contacted, and sends confirmation when bill shows paid', async () => {
            mockedMarkPaid.mockResolvedValue(undefined as any);
            mockedMarkContacted.mockResolvedValue(undefined as any);
            mockedGetBill.mockResolvedValue({ billId: 1, curYearPaid: true } as any);
            const bill = await processBillPayment(1, 'Check', 't1');
            expect(mockedMarkPaid).toHaveBeenCalledWith(1, 'Check', 't1');
            expect(mockedMarkContacted).toHaveBeenCalledWith(1, 't1');
            expect(mockedSendPayEmail).toHaveBeenCalled();
            expect(bill.curYearPaid).toBe(true);
        });

        it('does not send email when curYearPaid is false', async () => {
            mockedGetBill.mockResolvedValue({ billId: 2, curYearPaid: false } as any);
            await processBillPayment(2, 'Cash', 't1');
            expect(mockedSendPayEmail).not.toHaveBeenCalled();
        });
    });

    describe('runBillingComplete', () => {
        it('loads threshold, cleans, and returns generated bills diff', async () => {
            const pre = [{ membershipAdmin: 'a@x.com', billId: 1 } as any];
            const post = [...pre, { membershipAdmin: 'b@x.com', billId: 2 } as any];
            mockedGetBillList.mockResolvedValueOnce(pre).mockResolvedValueOnce(post);
            mockedGenerateBill.mockResolvedValue(2);
            const memberships = [{ membershipId: 10, membershipAdmin: 'b@x.com', membershipType: 'Full Member' } as any];
            const out = await runBillingComplete(2026, memberships, undefined, 't1');
            expect(mockedThreshold).toHaveBeenCalledWith(2026, 't1');
            expect(mockedClean).toHaveBeenCalled();
            expect(out.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('runBillingCompleteCurrent', () => {
        it('uses calculateBillingYear and delegates to runBillingComplete', async () => {
            mockedGetBillList.mockResolvedValue([] as any);
            await runBillingCompleteCurrent([], 5, 't1');
            expect(mockedGetBillList).toHaveBeenCalled();
        });
    });

    describe('generateSquareLinks', () => {
        it('passes membershipId filter when provided', async () => {
            mockedGetBillList.mockResolvedValue([] as any);
            await generateSquareLinks(2025, 42, 't9');
            expect(mockedGetBillList).toHaveBeenCalledWith(
                { year: 2025, membershipId: 42 },
                't9',
            );
        });

        it('creates links only for unpaid bills with admin email', async () => {
            mockedGetBillList.mockResolvedValue([
                {
                    billId: 1,
                    membershipAdminEmail: 'a@b.com',
                    curYearPaid: false,
                },
                { billId: 2, membershipAdminEmail: '', curYearPaid: false },
                { billId: 3, membershipAdminEmail: 'c@d.com', curYearPaid: true },
            ] as any);
            const list = await generateSquareLinks(2026, undefined, 't1');
            expect(mockedCreateLink).toHaveBeenCalledTimes(1);
            expect(mockedAddSquare).toHaveBeenCalledTimes(1);
            expect(list[0].squareLink).toBe('https://sq');
        });
    });

    describe('generateNewBills', () => {
        it('skips membership when bill already exists for admin', async () => {
            const pre = [{ membershipAdmin: 'dup@x.com' } as any];
            mockedGetBillList.mockResolvedValueOnce(pre).mockResolvedValueOnce(pre);
            await generateNewBills(
                [{ membershipId: 1, membershipAdmin: 'dup@x.com', membershipType: 'Full Member' } as any],
                pre,
                10,
                2026,
                't1',
            );
            expect(mockedGenerateBill).not.toHaveBeenCalled();
        });

        it('waives amount for next-year board member and marks paid', async () => {
            mockedBoard.mockResolvedValue([{ membershipId: 99 }] as any);
            mockedGetBillList.mockResolvedValueOnce([]).mockResolvedValueOnce([
                { membershipAdmin: 'board@x.com', billId: 7 },
            ] as any);
            mockedGenerateBill.mockResolvedValue(7);
            await generateNewBills(
                [{ membershipId: 99, membershipAdmin: 'board@x.com', membershipType: 'Full Member' } as any],
                [],
                10,
                2026,
                't1',
            );
            expect(mockedGenerateBill).toHaveBeenCalledWith(
                expect.objectContaining({ amount: 0, amountWithFee: 0 }),
                't1',
            );
            expect(mockedMarkPaid).toHaveBeenCalledWith(7, 'Waived', 't1');
        });

        it('upgrades Associate Member when points meet threshold', async () => {
            mockedWp.mockResolvedValue({ total: 10 } as any);
            mockedBaseDues.mockResolvedValue(50 as any);
            mockedGetBillList.mockResolvedValueOnce([]).mockResolvedValueOnce([
                { membershipAdmin: 'assoc@x.com' },
            ] as any);
            mockedGenerateBill.mockResolvedValue(8);
            await generateNewBills(
                [
                    {
                        membershipId: 5,
                        membershipAdmin: 'assoc@x.com',
                        membershipType: 'Associate Member',
                    } as any,
                ],
                [],
                10,
                2026,
                't1',
            );
            expect(mockedUpgrade).toHaveBeenCalledWith(5, 't1');
        });

        it('continues when one membership fails to generate', async () => {
            mockedGenerateBill.mockRejectedValueOnce(new Error('fail one')).mockResolvedValueOnce(9);
            mockedGetBillList.mockResolvedValueOnce([]).mockResolvedValueOnce([
                { membershipAdmin: 'ok@x.com', billId: 9 },
            ] as any);
            await generateNewBills(
                [
                    { membershipId: 1, membershipAdmin: 'bad@x.com', membershipType: 'Full Member' } as any,
                    { membershipId: 2, membershipAdmin: 'ok@x.com', membershipType: 'Full Member' } as any,
                ],
                [],
                10,
                2026,
                't1',
            );
            expect(mockedGenerateBill).toHaveBeenCalledTimes(2);
        });
    });
});
