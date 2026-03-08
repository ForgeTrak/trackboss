import _ from 'lodash';
import { compareDesc, isFuture } from 'date-fns';
import { getJobList } from '../database/job';
import {
    addSquareAttributes,
    cleanBilling, generateBill, getBill, getBillList,
    getWorkPointThreshold, markBillPaid, markContactedAndRenewing,
} from '../database/billing';
import { getBaseDues, upgradeMembershipSenior } from '../database/membership';
import { getWorkPointsByMembership } from '../database/workPoints';
import logger from '../logger';
import { Bill } from '../typedefs/bill';
import { Membership } from '../typedefs/membership';
import { Job } from '../typedefs/job';
import { getBoardMemberList } from '../database/boardMember';
import { sendPaymentConfirmationEmail } from './email';
import createPaymentLink from '../integrations/square';
import { calculateBillingYear } from './dateHelper';

/**
 * Generate new bills in the database
 *
 * Note that an error generating a bill **does not** short-circuit the loop. The
 * function will create all the bills it can.
 *
 * (Extracted into helper function to ease testing)
 *
 * @param membershipList A bill is generated for each membership in this list
 * @param preGeneratedBills Any preexisting bills for the specified year so that
 * duplicate bills are not created
 * @param threshold The work point threshold for the specified year
 * @param year The year to generate bills for
 * @returns A list of *only* the bills that were just generated (does not
 * include preexisting bills)
 */
export async function generateNewBills(
    membershipList: Membership[],
    preGeneratedBills: Bill[],
    threshold: number,
    year: number,
    tenantId: string,
): Promise<Bill[]> {
    // look at the next year's board members because they pay $0.
    const boardMembers = await getBoardMemberList(tenantId, (year + 1).toString(10));
    await Promise.all(membershipList.map(async (membership) => {
        // only generate a bill if one hasn't already been generated
        if (typeof _.find(
            preGeneratedBills,
            (bill) => bill.membershipAdmin === membership.membershipAdmin,
        ) === 'undefined') {
            try {
                logger.info(`Running billing for membership with id ${membership.membershipId}`);
                const baseDues = await getBaseDues(membership.membershipId, tenantId);
                const earned = (await getWorkPointsByMembership(membership.membershipId, year)).total;
                let owed = Math.max((1 - earned / threshold) * baseDues, 0);
                // the Paypal Fee is 0.0290%, plus $0.30.  We hard code this here, with a big ole comment
                // describing what it is.  It's not great but their rule is generally static.
                let fee = (owed * 0.0300) + 0.30;
                if (owed === 0) {
                    fee = 0;
                }
                const isBoardNextYear = boardMembers.find((m) => (m.membershipId === membership.membershipId));
                // if they are on next year's Board, dues are also waived.
                if (isBoardNextYear) {
                    owed = 0;
                    fee = 0;
                }
                let workDetail = await getJobList({ membershipId: membership.membershipId, year }, tenantId);
                workDetail = workDetail.filter((job: Job) => (!job.paid && !isFuture(job.start as Date)));
                // sort by date.  I have to do this in JS due to the way jobs are stored in two different tables and
                // messed with here.  Post 2022 this will no longer be required.
                workDetail.sort((a: Job, b: Job) => compareDesc(a.start as Date, b.start as Date));
                const billId = await generateBill({
                    amount: owed,
                    amountWithFee: (owed + fee),
                    membershipId: membership.membershipId,
                    pointsEarned: earned,
                    pointsThreshold: threshold,
                    workDetail,
                    billingYear: year,
                }, tenantId);
                if (owed === 0) {
                    // flip the bill to paid if they owe zero. This is just easy record keeping.
                    await markBillPaid(billId, 'Waived', tenantId);
                }
                // if they are at or over the threshold, then update their membership type.
                if ((earned >= threshold) && (membership.membershipType === 'Associate Member')) {
                    await upgradeMembershipSenior(membership.membershipId, tenantId);
                    // eslint-disable-next-line max-len
                    logger.info(`Automatically updated ${membership.membershipAdmin} membership to Senior based on ${earned} points.`);
                }
            } catch (e) {
                // generate more bills even if this one failed
                logger.error(`Failed to generate bill for membership with ID ${membership.membershipId}: ${e}`);
            }
        }
    }));
    const allBills = await getBillList({ year }, tenantId);
    return _.differenceWith(allBills, preGeneratedBills, _.isEqual);
}

export async function processBillPayment(billId: number, paymentMethod: string, tenantId: string) {
    logger.info(`marking bill ${billId} paid with payment method ${paymentMethod}`);
    await markBillPaid(billId, paymentMethod, tenantId);
    await markContactedAndRenewing(billId, tenantId);
    const bill = await getBill(billId, tenantId);
    logger.info(`Got bill id ${billId} and its paid status is ${bill.curYearPaid}`);
    // if they marked the attestation as complete, send an email.
    if (bill.curYearPaid) {
        logger.info(`Sending email for bill ID ${billId}`);
        await sendPaymentConfirmationEmail(bill);
        logger.info(`bill ID ${billId} confirmation email was sent.`);
    }
    return bill;
}

export async function runBillingComplete(
    year: number, membershipList: Membership[],
    membershipId?: number, tenantId?: string,
) {
    const { threshold } = await getWorkPointThreshold(year, tenantId || '');
    logger.info(`billing - Running billing for year ${year} with threshold of ${threshold}`);
    // to protect against generating duplicate bills
    const cleanedUp = await cleanBilling(year, membershipId, tenantId);
    const preGeneratedBills = await getBillList({ year, membershipId }, tenantId || '');
    const generatedBills = await generateNewBills(membershipList, preGeneratedBills, threshold, year, tenantId || '');
    return generatedBills;
}

export async function runBillingCompleteCurrent(membershipList: Membership[], membershipId: number, tenantId: string) {
    const currentYear = calculateBillingYear();
    const billsBillsBills = await runBillingComplete(currentYear, membershipList, membershipId, tenantId);
    return billsBillsBills;
}

export async function generateSquareLinks(billingYear: number, membershipId?: number, tenantId?: string) {
    const billingFilters : any = {
        year: Number(billingYear),
    };
    if (membershipId) {
        billingFilters.membershipId = Number(membershipId);
    }
    const billingList: Bill[] = await getBillList(billingFilters, tenantId || '');
    logger.info('Billing Job - starting Square link generation.');
    // I don't care if this is slower, I would actualy prefer it so I don't hit Square's rate limits.
    // This runs once a year so who cares how fast it is anyway?
    let linkCount = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const bill of billingList) {
        // no need to create checkout links for anyone who owes zero.  It's pointless.
        if (bill.membershipAdminEmail && !bill.curYearPaid) {
            // see above for why this is this way.
            // eslint-disable-next-line no-await-in-loop
            const paymentInfo = await createPaymentLink(bill);
            bill.squareLink = paymentInfo.squareUrl;
            bill.squareOrderId = paymentInfo.squareOrderId;
            logger.info(`${bill.billId} - ${bill.squareLink}`);
            // slow down sally, you're moving too fast.....
            // eslint-disable-next-line no-await-in-loop
            await addSquareAttributes(bill, tenantId || '');
            linkCount += 1;
            logger.info(`Billing Job - Generated square id ${bill.squareOrderId} for bill ${bill.billId} ${linkCount}`);
        }
        logger.info(`Billing Job - Generated square links for ${linkCount} bills`);
    }
    return billingList;
}
