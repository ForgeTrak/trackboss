import _ from 'lodash';
import { OkPacket, RowDataPacket } from 'mysql2';

import logger from '../logger';
import { getPool } from './pool';
import { MemberType, PatchMemberTypeRequest } from '../typedefs/memberType';

export const PATCH_MEMBER_TYPE_SQL = 'CALL sp_patch_member_type(?, ?, ?)';

export async function getMemberType(id: number, tenantId: string): Promise<MemberType> {
    const values = [id, tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(
            'select * from v_member_type mt where mt.member_type_id = ? and mt.tenant_id = ?',
            values,
        );
    } catch (e) {
        logger.error(`DB error getting member type: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        tenantId: results[0].tenant_id,
        memberTypeId: results[0].member_type_id,
        type: results[0].type,
        baseDuesAmt: results[0].base_dues_amt,
    };
}

export async function getMembershipType(tenantId: string, typeName: string): Promise<MemberType> {
    const values = [typeName, tenantId];

    let results;
    try {
        // eslint-disable-next-line max-len
        [results] = await getPool().query<RowDataPacket[]>('select * from membership_types mt where mt.type = ? and mt.tenant_id = ?', values);
    } catch (e) {
        logger.error(`DB error getting member type: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        memberTypeId: results[0].membership_type_id,
        tenantId: results[0].tenant_id,
        type: results[0].type,
        baseDuesAmt: results[0].base_dues_amt,
    };
}

export async function getMembershipTypes(tenantId: string): Promise<MemberType[]> {
    let results;
    try {
        // eslint-disable-next-line max-len
        [results] = await getPool().query<RowDataPacket[]>('select * from membership_types mt where mt.tenant_id = ?', [tenantId]);
    } catch (e) {
        logger.error(`DB error getting member type: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return results.map((result) => ({
        memberTypeId: result.member_type_id,
        tenantId: result.tenant_id,
        type: result.type,
        baseDuesAmt: result.base_dues_amt,
    }));
}

export async function getMemberTypeList(tenantId: string): Promise<MemberType[]> {
    const sql = 'select * from v_member_type mt where mt.tenant_id = ?';
    const values: string[] = [tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting member type list: ${e}`);
        throw new Error('internal server error');
    }
    return results.map((result) => ({
        memberTypeId: result.member_type_id,
        tenantId: result.tenant_id,
        type: result.type,
        baseDuesAmt: result.base_dues_amt,
    }));
}

export async function patchMemberType(id: number, tenantId: string, req: PatchMemberTypeRequest): Promise<void> {
    if (_.isEmpty(req)) {
        throw new Error('user input error');
    }

    const values = [req.type, req.baseDuesAmt, id, tenantId];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(
            'update membership_types set type = ?, base_dues_amt = ? where membership_type_id = ? and tenant_id = ?',
            values,
        );
    } catch (e: any) {
        logger.error(`DB error patching member type: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}

export async function getMembershipTypeCounts(tenantId: string): Promise<MemberType[]> {
    const sql = `
        select ms.membership_type, mt.base_dues_amt, mt.membership_type_id, count(*) howmany
        from v_membership ms, membership_types mt where 
        ms.status = 'active' and
        ms.membership_type is not null and
        ms.membership_type = mt.type and
        mt.tenant_id = ?
        group by ms.membership_type
    `;
    const values: string[] = [tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting member type list: ${e}`);
        throw new Error('internal server error');
    }
    return results.map((result) => ({
        memberTypeId: result.membership_type_id,
        tenantId: result.tenant_id,
        type: result.membership_type,
        baseDuesAmt: result.base_dues_amt,
        count: result.howmany,
    }));
}
