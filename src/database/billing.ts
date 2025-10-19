import _ from 'lodash';
import { OkPacket, RowDataPacket } from 'mysql2';

import logger from '../logger';
import { getPool } from './pool';
import { Bill, GenerateSingleBillRequest, GetBillListRequestFilters, WorkPointThreshold } from '../typedefs/bill';

export const GET_BILL_LIST_SQL = 'SELECT * FROM v_bill';
export const GET_THRESHOLD_SQL = 'SELECT * FROM point_threshold WHERE year = ?';
export const GENERATE_BILL_SQL =
    'INSERT INTO member_bill (generated_date, year, amount, amount_with_fee, membership_id, emailed_bill, ' +
    'cur_year_paid, threshold, points_earned, work_detail) ' +
    'VALUES (CURDATE(), ?, ?, ?, ?, NULL, 0, ?, ?, ?)';
export const PATCH_BILL_SQL = 'CALL sp_patch_bill (?, ?, ?)';

export async function generateBill(req: GenerateSingleBillRequest): Promise<number> {
    const workDetailJson = JSON.stringify(
        req.workDetail,
        function replacer(key, value) {
            if (this[key] instanceof Date) {
                const workDateStr = this[key].toLocaleDateString('en-US');
                return workDateStr;
            }
            return value;
        },
    );

    const values = [
        req.billingYear, req.amount.toFixed(2), req.amountWithFee.toFixed(2), req.membershipId,
        req.pointsThreshold, req.pointsEarned, workDetailJson,
    ];
    let result;
    try {
        [result] = await getPool().query<OkPacket>(GENERATE_BILL_SQL, values);
    } catch (e) {
        // FK violations are technically possible, but membership IDs should only have
        // been recently grabbed from the database anyway - no chance for user error
        logger.error(`DB error generating bill: ${e}`);
        throw new Error('internal server error');
    }

    return result.insertId;
}

export async function getWorkPointThreshold(year: number): Promise<WorkPointThreshold> {
    const values = [year];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(GET_THRESHOLD_SQL, values);
    } catch (e) {
        logger.error(`DB error getting work point threshold: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        year: results[0].year,
        threshold: results[0].amount,
    };
}

export async function getBillList(filters: GetBillListRequestFilters): Promise<Bill[]> {
    let sql;
    let values: any[] = [];
    if (_.values(filters).find((filter) => typeof filter !== 'undefined')) {
        let dynamicSql = ' WHERE ';
        let counter = 0;
        if (typeof filters.membershipId !== 'undefined') {
            dynamicSql += 'membership_id = ? AND ';
            values[counter++] = filters.membershipId;
        }
        if (typeof filters.year !== 'undefined') {
            dynamicSql += 'year = ? AND ';
            values[counter++] = filters.year;
        }
        if (typeof filters.paymentStatus !== 'undefined') {
            if (filters.paymentStatus === 'outstanding') {
                dynamicSql += 'cur_year_paid = 0 AND ';
            }
            if (filters.paymentStatus === 'paid') {
                dynamicSql += 'cur_year_paid = 1 AND ';
            }
        }
        if (typeof filters.membershipStatus !== 'undefined') {
            dynamicSql += 'status = ? AND ';
            values[counter++] = filters.membershipStatus;
        }
        sql = GET_BILL_LIST_SQL + dynamicSql.slice(0, -4); // Slice the trailing AND
    } else {
        sql = GET_BILL_LIST_SQL;
        values = [];
    }

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting bill list: ${e}`);
        throw new Error('internal server error');
    }
    return results.map((result) => ({
        billId: result.bill_id,
        generatedDate: result.generated_date,
        year: result.year,
        amount: result.amount.toFixed(2),
        amountWithFee: result.amount_with_fee.toFixed(2),
        membershipAdmin: result.membership_admin,
        membershipId: result.membership_id,
        firstName: result.first_name,
        lastName: result.last_name,
        membershipAdminEmail: result.membership_admin_email,
        phone: result.phone_number,
        membershipType: result.membership_type,
        emailedBill: result.emailed_bill,
        curYearPaid: !!result.cur_year_paid[0],
        curYearIns: !!result.cur_year_ins[0],
        dueDate: new Date((result.year + 1), 1, 1).toDateString(),
        pointsEarned: result.points_earned,
        pointsThreshold: result.threshold,
        paymentMethod: result.payment_method,
        squareLink: result.square_link,
        squareOrderId: result.square_order_id,
        contactedAndRenewing: result.renewal_contacted,
        detail: result.work_detail,
        memberActive: result.status,
    }));
}

export async function markBillEmailed(id: number): Promise<void> {
    let result;
    try {
        [result] = await getPool().query<OkPacket>(PATCH_BILL_SQL, [id, 'CURDATE()', null]);
    } catch (e) {
        logger.error(`DB error marking bill as emailed: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}

export async function markBillPaid(id: number, paymentMethod?: string): Promise<void> {
    let result;
    try {
        const sql =
          // eslint-disable-next-line max-len
          'update member_bill set cur_year_paid = 1, payment_method = ?, last_updated_date = current_timestamp()  where bill_id = ?';
        [result] = await getPool().query<OkPacket>(sql, [paymentMethod, id]);
    } catch (e) {
        logger.error(`DB error marking bill as paid: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}

export async function markInsuranceAttestation(id: number): Promise<void> {
    let result;
    try {
        const sql =
          'update member_bill set cur_year_ins = 1 where bill_id = ?';
        [result] = await getPool().query<OkPacket>(sql, [id]);
    } catch (e) {
        logger.error(`DB error marking bill as paid: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}

export async function markContactedAndRenewing(id: number): Promise<void> {
    let result;
    try {
        const sql =
          'update member_bill set renewal_contacted = 1 where bill_id = ?';
        [result] = await getPool().query<OkPacket>(sql, [id]);
    } catch (e) {
        logger.error(`DB error marking bill as paid: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}

export async function discountBill(id: number, amount: number, amountWithFee: number): Promise<void> {
    let result;
    const params = [amount, amountWithFee, id];
    try {
        const sql =
          'update member_bill set amount = ?, amount_with_fee = ? where bill_id = ?';
        [result] = await getPool().query<OkPacket>(sql, params);
    } catch (e) {
        logger.error(`DB error marking bill as paid: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}

export async function addSquareAttributes(bill: Bill): Promise<void> {
    let result;
    try {
        const sql =
          'update member_bill set square_link = ?, square_order_id = ? where bill_id = ?';
        [result] = await getPool().query<OkPacket>(sql, [bill.squareLink, bill.squareOrderId, bill.billId]);
    } catch (e) {
        logger.error(`DB error adding square attributes: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}

export async function cleanBilling(year: number, membershipId?: number): Promise<number> {
    let param;
    let result;
    let sql;
    if (membershipId) {
        sql = 'delete from member_bill where membership_id = ? and year = ? and cur_year_ins = 0';
        param = [membershipId, year];
    } else {
        sql = 'delete from member_bill where year = ? and cur_year_ins = 0';
        param = [year];
    }
    try {
        [result] = await getPool().query<OkPacket>(sql, param);
    } catch (e) {
        logger.error('DB error cleaning up bills', e);
        throw e;
    }
    logger.info(`billing cleanup for ${year}, ${result.affectedRows} bills cleaned up`);
    return result.affectedRows;
}

export async function getBill(billId: number) : Promise<Bill> {
    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>('select * from v_bill where bill_id = ?', [billId]);
    } catch (e) {
        logger.error(`DB error getting bill list: ${e}`);
        throw new Error('internal server error');
    }
    const billResultSingle = results[0];
    const bill = {
        billId: billResultSingle.bill_id,
        generatedDate: billResultSingle.generated_date,
        year: billResultSingle.year,
        amount: billResultSingle.amount,
        amountWithFee: billResultSingle.amount_with_fee,
        membershipAdmin: billResultSingle.membership_admin,
        membershipId: billResultSingle.membership_id,
        firstName: billResultSingle.first_name,
        lastName: billResultSingle.last_name,
        membershipAdminEmail: billResultSingle.membership_admin_email,
        phone: billResultSingle.phone_number,
        membershipType: billResultSingle.membership_type,
        emailedBill: billResultSingle.emailed_bill,
        curYearPaid: !!billResultSingle.cur_year_paid[0],
        curYearIns: !!billResultSingle.cur_year_ins[0],
        dueDate: new Date((billResultSingle.year + 1), 1, 15).toDateString(),
        pointsEarned: billResultSingle.points_earned,
        pointsThreshold: billResultSingle.threshold,
        paymentMethod: billResultSingle.payment_method,
        squareLink: billResultSingle.square_link,
        squareOrderId: billResultSingle.square_order_id,
        detail: billResultSingle.work_detail,
        memberActive: billResultSingle.status,
    };
    return bill;
}

export async function getBillByOrderId(orderId: string) : Promise<any> {
    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>('select * from v_bill where square_order_id = ?', [orderId]);
    } catch (e) {
        logger.error(`DB error getting bill list: ${e}`);
        throw new Error('internal server error');
    }
    if (results[0]) {
        const billResultSingle = results[0];
        const bill = {
            billId: billResultSingle.bill_id,
            generatedDate: billResultSingle.generated_date,
            year: billResultSingle.year,
            amount: billResultSingle.amount,
            amountWithFee: billResultSingle.amount_with_fee,
            membershipAdmin: billResultSingle.membership_admin,
            membershipId: billResultSingle.membership_id,
            firstName: billResultSingle.first_name,
            lastName: billResultSingle.last_name,
            membershipAdminEmail: billResultSingle.membership_admin_email,
            phone: billResultSingle.phone_number,
            membershipType: billResultSingle.membership_type,
            emailedBill: billResultSingle.emailed_bill,
            curYearPaid: !!billResultSingle.cur_year_paid[0],
            curYearIns: !!billResultSingle.cur_year_ins[0],
            dueDate: new Date((billResultSingle.year + 1), 1, 15).toDateString(),
            pointsEarned: billResultSingle.points_earned,
            pointsThreshold: billResultSingle.threshold,
            paymentMethod: billResultSingle.payment_method,
            squareLink: billResultSingle.square_link,
            squareOrderId: billResultSingle.square_order_id,
            detail: billResultSingle.work_detail,
            memberActive: billResultSingle.status,
        };
        return bill;
    }
    return {};
}

export async function getLatestBillMembership(membershipId: number) : Promise<Bill> {
    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(
            'select * from v_bill where membership_id = ? and year = year(now())-1',
            [membershipId],
        );
    } catch (e) {
        logger.error(`DB error getting bill list: ${e}`);
        throw new Error('internal server error');
    }
    const billResultSingle = results[0];
    const bill = {
        billId: billResultSingle.bill_id,
        generatedDate: billResultSingle.generated_date,
        year: billResultSingle.year,
        amount: billResultSingle.amount,
        amountWithFee: billResultSingle.amount_with_fee,
        membershipAdmin: billResultSingle.membership_admin,
        membershipId: billResultSingle.membership_id,
        firstName: billResultSingle.first_name,
        lastName: billResultSingle.last_name,
        membershipAdminEmail: billResultSingle.membership_admin_email,
        phone: billResultSingle.phone_number,
        membershipType: billResultSingle.membership_type,
        emailedBill: billResultSingle.emailed_bill,
        curYearPaid: !!billResultSingle.cur_year_paid[0],
        curYearIns: !!billResultSingle.cur_year_ins[0],
        dueDate: new Date((billResultSingle.year + 1), 1, 15).toDateString(),
        pointsEarned: billResultSingle.points_earned,
        pointsThreshold: billResultSingle.threshold,
        paymentMethod: billResultSingle.payment_method,
        squareLink: billResultSingle.square_link,
        squareOrderId: billResultSingle.square_order_id,
        detail: billResultSingle.work_detail,
        memberActive: billResultSingle.status,
    };
    return bill;
}
