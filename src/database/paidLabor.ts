import { OkPacket, RowDataPacket } from 'mysql2';

import logger from '../logger';
import { getPool } from './pool';
import { PaidLabor } from '../typedefs/paidLabor';

export async function getPaidLabor(tenantId: string): Promise<PaidLabor[]> {
    const sql = 'select * from paid_labor where tenant_id = ?';

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, [tenantId]);
    } catch (e) {
        logger.error(`DB error getting paid labor list: ${e}`);
        throw new Error('internal server error');
    }
    return results.map((result) => ({
        paidLaborId: result.paid_labor_id,
        tenantId: result.tenant_id,
        firstName: result.first_name,
        lastName: result.last_name,
        businessName: result.business_name,
        phoneNumber: result.phone,
        email: result.email,
    }));
}

export async function getPaidLaborById(id: number, tenantId: string): Promise<PaidLabor> {
    const sql = 'select * from paid_labor where paid_labor_id = ? and tenant_id = ?';
    const values: any[] = [id, tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting paid labor list: ${e}`);
        throw new Error('internal server error');
    }
    return {
        paidLaborId: results[0].paid_labor_id,
        tenantId: results[0].tenant_id,
        firstName: results[0].first_name,
        lastName: results[0].last_name,
        businessName: results[0].business_name,
        phoneNumber: results[0].phone_number,
        email: results[0].email,
    };
}

export async function deletePaidLaborById(id: number, tenantId: string): Promise<PaidLabor> {
    const values = [id, tenantId];

    let result;
    try {
        // eslint-disable-next-line max-len
        [result] = await getPool().query<OkPacket>('delete from paid_labor where paid_labor_id = ? and tenant_id = ?', values);
    } catch (e) {
        logger.error(`DB error deleting paid labor: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
    return { paidLaborId: id };
}

export async function createPaidLabor(paidLabor: PaidLabor, tenantId: string): Promise<PaidLabor> {
    const values = [paidLabor.businessName, paidLabor.email, paidLabor.firstName,
        paidLabor.lastName, paidLabor.phoneNumber, tenantId,
    ];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(
            `insert into paid_labor (business_name, email, first_name, last_name, phone, tenant_id)
            values 
            (?, ?, ?, ?, ?, ?)`,
            values,
        );
    } catch (e) {
        logger.error(`DB error creating paid labor: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
    const createdPaidLabor: PaidLabor = await getPaidLaborById(result.insertId, tenantId);
    return createdPaidLabor;
}

export async function updatePaidLabor(id:number, paidLabor: PaidLabor, tenantId: string): Promise<PaidLabor> {
    const values = [paidLabor.businessName, paidLabor.email, paidLabor.firstName,
        paidLabor.lastName, paidLabor.phoneNumber, id, tenantId,
    ];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(
            `update paid_labor set 
            business_name = ?, email = ?, first_name = ?, last_name = ?, phone = ? where 
            paid_labor_id = ? and tenant_id = ?`,
            values,
        );
    } catch (e) {
        logger.error(`DB error deleting event: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
    const createdPaidLabor: PaidLabor = await getPaidLaborById(id, tenantId);
    return createdPaidLabor;
}
