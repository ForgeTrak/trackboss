import { Request, Response, Router } from 'express';
// import { format } from 'date-fns';
import { getMembershipList } from '../database/membership';
import {
    addSquareAttributes,
    discountBill,
    getBill, getBillByOrderId, getBillList, getWorkPointThreshold,
    markContactedAndRenewing,
    markInsuranceAttestation,
} from '../database/billing';
import {
    Bill,
    GetBillListResponse,
    GetMembershipBillListResponse,
    GetWorkPointThresholdResponse,
    PostCalculateBillsResponse,
    PostPayBillResponse,
} from '../typedefs/bill';
import { checkHeader, validateAdminAccess, verify } from '../util/auth';
import { generateSquareLinks, processBillPayment, runBillingComplete } from '../util/billing';
import { sendInsuranceConfirmEmail } from '../util/email';
import logger from '../logger';
import { calculateBillingYear } from '../util/dateHelper';
import { formatWorkbook, httpOutputWorkbook, startWorkbook } from '../excel/workbookHelper';
import createPaymentLink from '../integrations/square';
import logAuditEvent from '../database/auditLog';

//
// TODO: Emails are not sent for generated bills (see emailBills helper function in util)
// (also uncomment the import on line 3)
//
// TODO: No fee calculated for bills (see generateNewBills helper function in util)
//

const billing = Router();

billing.get('/yearlyWorkPointThreshold', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetWorkPointThresholdResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            // If the year is undefined or NaN, just default to this year
            const year = Number(req.query.year) || new Date().getFullYear();
            response = await getWorkPointThreshold(year, req.user.tenantId);
            res.status(200);
        } catch (e: any) {
            logger.error(`billing - Error at path ${req.path}`, e);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

billing.get('/list', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetBillListResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            logger.info('billing - Getting billing list.');
            const { paymentStatus, year } = req.query;
            let billingYear = Number(year);
            if (!billingYear) {
                billingYear = calculateBillingYear();
                logger.info(`billing - Billing year was undefined we calculated it as ${billingYear}.`);
            }
            const billingList: Bill[] = await getBillList({
                paymentStatus: paymentStatus as string,
                year: Number(billingYear),
                membershipStatus: 'active',
            }, req.user.tenantId);
            res.status(200);
            response = billingList;
        } catch (e: any) {
            logger.error(`billing - Error at path ${req.path}`, e);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

billing.get('/:membershipID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMembershipBillListResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Member');
            const membershipId = Number(req.params.membershipID);
            if (Number.isNaN(membershipId)) {
                throw new Error('not found');
            }

            const results = await getBillList({ membershipId, membershipStatus: 'Active' }, req.user.tenantId);
            response = results;
            res.status(200);
        } catch (e: any) {
            logger.error(`billing - Error at path ${req.path}`, e);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

billing.post('/:billId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostPayBillResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Membership Admin');
            const billId = Number(req.params.billId);
            const { paymentMethod } = req.query || '';
            if (Number.isNaN(billId)) {
                throw new Error('not found');
            }
            logger.info(`billing - Processing payment for bill ${billId} with payment method ${paymentMethod}`);
            const before = await getBill(billId, req.user.tenantId);
            await processBillPayment(billId, paymentMethod?.toString() || '', req.user.tenantId);
            const after = await getBill(billId, req.user.tenantId);
            logAuditEvent(req, 'bill', billId, before, after);
            response = {};
            res.status(200);
        } catch (e: any) {
            logger.error(`billing - Error at path ${req.path}`, e);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

billing.post('/', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostCalculateBillsResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Admin');
            const curYear = new Date().getFullYear();
            logger.info(`billing - Running billing for year ${curYear} on tenant ${req.user.tenantId}`);
            const membershipList = await getMembershipList('active', req.user.tenantId);
            const generatedBills = await runBillingComplete(curYear, membershipList, undefined, req.user.tenantId);
            res.status(201);
            response = generatedBills;
        } catch (e: any) {
            logger.error(`billing - Error at path ${req.path}`, e);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

billing.patch('/attestIns/:billId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostPayBillResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Membership Admin');
            const billId = Number(req.params.billId);
            if (Number.isNaN(billId)) {
                throw new Error('not found');
            }
            const originalBill = await getBill(billId, req.user.tenantId);
            const billingLog = `user ${req.user.uuid} on tenant ${req.user.tenantId} for bill ${billId}`;
            if (!originalBill.curYearIns) {
                // eslint-disable-next-line max-len
                logger.info(`billing - Marking insurance attestation as complete for ${billingLog}`);
                await markInsuranceAttestation(billId, req.user.tenantId);
            }
            const bill = await getBill(billId, req.user.tenantId);
            // if they marked the attestation as complete, send an email.
            if (!originalBill.curYearIns && bill.curYearIns) {
                await sendInsuranceConfirmEmail(bill);
                logger.info(`billing - Sent insurance confirmation email for ${billingLog}`);
            }
            // if the bill is zero, mark the member as contacted because because they are done and there
            // is no need to check them.
            if (bill.amount === 0) {
                await markContactedAndRenewing(billId, req.user.tenantId);
                logger.info(`billing - Marked bill ${billId} as contacted and renewing because the amount is zero`);
            }
            response = {};
            logAuditEvent(req, 'bill', billId, originalBill, bill);
            res.status(200);
        } catch (e: any) {
            logger.error(`billing - Error at path ${req.path}`, e);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

billing.patch('/markContacted/:billId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostPayBillResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Membership Admin');
            const billId = Number(req.params.billId);
            if (Number.isNaN(billId)) {
                throw new Error('not found');
            }
            const before = await getBill(billId, req.user.tenantId);
            await markContactedAndRenewing(billId, req.user.tenantId);
            const after = await getBill(billId, req.user.tenantId);
            response = {};
            logAuditEvent(req, 'bill', billId, before, after);
            res.status(200);
        } catch (e: any) {
            logger.error(`billing - Error at path ${req.path}`, e);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

billing.patch('/discount/:billId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostPayBillResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Membership Admin');
            const billId = Number(req.params.billId);
            if (Number.isNaN(billId)) {
                throw new Error('not found');
            }
            const bill = await getBill(billId, req.user.tenantId);
            const discountPercent = 50;
            const newAmount = bill.amount * (discountPercent / 100);
            const newAmountWithFee = bill.amountWithFee * (discountPercent / 100);
            await discountBill(billId, newAmount, newAmountWithFee, req.user.tenantId);
            bill.amount = newAmount;
            bill.amountWithFee = newAmountWithFee;
            const paymentLink = await createPaymentLink(bill);
            bill.squareLink = paymentLink.squareUrl;
            bill.squareOrderId = paymentLink.squareOrderId;
            await addSquareAttributes(bill, req.user.tenantId);
            const after = await getBill(billId, req.user.tenantId);
            response = {};
            logger.info(`billing - Discounted bill ${billId} for user ${req.user.uuid} on tenant ${req.user.tenantId}`);
            logAuditEvent(req, 'bill', Number(req.params.billId), bill, after);
            res.status(200);
        } catch (e: any) {
            logger.error(`billing - Error at path ${req.path}`, e);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

billing.get('/list/excel', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        logger.info('Getting billing list.');
        const { paymentStatus, year } = req.query;
        let billingYear = Number(year);
        if (!billingYear) {
            billingYear = calculateBillingYear();
            logger.info(`Billing year was undefined so we calculated it as ${billingYear} at request time.`);
        }
        const billingList: Bill[] = await getBillList({
            paymentStatus: paymentStatus as string,
            year: Number(billingYear),
        }, req.user.tenantId);

        const workbookTitle = `PRA billing ${billingYear}`;
        const workbook = startWorkbook(workbookTitle);
        const worksheet = workbook.getWorksheet(1);
        worksheet.columns = [
            { header: 'Last Name', key: 'lastName', width: 10 },
            { header: 'First Name', key: 'firstName', width: 15 },
            { header: 'Points Earned', key: 'pointsEarned', width: 6 },
            { header: 'Amount', key: 'amount', width: 8 },
            { header: 'Membership Type', key: 'membershipType', width: 15 },
            { header: 'Insurance?', key: 'insurance', width: 6 },
            { header: 'Paid?', key: 'paid', width: 6 },
        ];
        billingList.forEach((bill: any) => {
            const row = {
                lastName: bill.lastName,
                firstName: bill.firstName,
                pointsEarned: bill.pointsEarned,
                amount: bill.amount,
                membershipType: bill.membershipType,
                insurance: bill.curYearIns ? 'Yes' : 'No',
                paid: bill.curYearPaid ? 'Yes' : 'No',
            };
            worksheet.addRow(row);
        });
        formatWorkbook(worksheet);
        // write workbook to buffer.
        httpOutputWorkbook(workbook, res, `billing${new Date().getTime()}`);
    } catch (error) {
        logger.error(`billing - Error at path ${req.path}`, error);
        res.status(500);
        res.send(error);
    }
});

billing.put('/create/checkoutlinks', async (req: Request, res: Response) => {
    try {
        const { authorization } = req.headers;
        const { membershipId } = req.query;
        let response: GetBillListResponse;
        const headerCheck = checkHeader(authorization);
        if (!headerCheck.valid) {
            res.status(401);
            response = { reason: headerCheck.reason };
            return;
        }
        logger.info('Getting billing list.');
        const { year } = req.query;
        let billingYear = Number(year);
        if (!billingYear) {
            billingYear = calculateBillingYear();
            logger.info(`billing -Billing year was undefined so we calculated it as ${billingYear} at request time.`);
        }
        const billingList = await generateSquareLinks(billingYear, Number(membershipId));
        logger.info(`billing - Generated ${billingList.length} checkout links for year ${billingYear}`);
        res.json(billingList);
    } catch (error) {
        logger.error(`billing - Error at path ${req.path}`, error);
        res.status(500);
        res.send(error);
    }
});

billing.post('/webhook/incoming', async (req: Request, res: Response) => {
    try {
        const orderUpdate = req.body;
        const paymentData = orderUpdate.data.object.payment;
        const squareOrderId = paymentData.order_id;
        logger.info(`billing - Got webhook for square order ID ${squareOrderId}`);
        const ourBill = await getBillByOrderId(squareOrderId);
        if (!ourBill) {
            logger.info(`billing - Square order ID ${squareOrderId} does not have an associated bill so ignoring it`);
            logger.info(JSON.stringify(paymentData));
            res.json({});
            return;
        }
        logger.info(`billing - Payment webhook incoming for ${squareOrderId}`);
        logger.debug(orderUpdate);
        // verify payment amount, status
        const paymentInFull = (paymentData.total_money.amount === (ourBill.amountWithFee * 100));
        const completed = (paymentData.status === 'COMPLETED');
        let billResponse;
        if (!ourBill.curYearPaid) {
            if (completed) {
                logger.info(`billing - Processing payment on our side for ${squareOrderId}, ${ourBill.billId}`);
                billResponse = await processBillPayment(ourBill.billId, 'Square', ourBill.tenantId);
            } else {
                // eslint-disable-next-line max-len
                logger.error(`billing - Marking bill ${ourBill.billId} as paid, but there could be a problem - verify manually`);
                billResponse = await processBillPayment(ourBill.billId, 'Square', ourBill.tenantId);
            }
        } else {
            // eslint-disable-next-line max-len
            logger.info(`billing - Got another webhook for ${ourBill.billId} as order Id ${ourBill.squareOrderId}. Ignoring.`);
        }
        logger.info(`billing - Payment complete for ${squareOrderId} and ${ourBill.membershipAdmin}`);
        logAuditEvent(req, 'bill', Number(req.params.billId), ourBill, billResponse);

        res.json(billResponse);
    } catch (error) {
        logger.error(`billing - Error at path ${req.path}`, error);
        res.status(500);
        res.send(error);
    }
});

export default billing;
