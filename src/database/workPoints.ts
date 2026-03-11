import _ from 'lodash';
import { OkPacket, RowDataPacket } from 'mysql2';
import { WorkPoints } from '../typedefs/workPoints';
import logger from '../logger';
import { getPool } from './pool';

export const GET_WORK_POINTS_BY_MEMBER_SQL =
    'select total_points from v_work_points_by_member where member_id = ? and year = ? and tenant_id = ?';
export const GET_WORK_POINTS_BY_MEMBERSHIP_SQL =
    'select total_points from v_work_points_by_membership where membership_id = ? and year = ? and tenant_id = ?';

export async function getWorkPointsByMember(memberId: number, year: number, tenantId: string): Promise<WorkPoints> {
    const values = [memberId, year, tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(GET_WORK_POINTS_BY_MEMBER_SQL, values);
    } catch (e) {
        logger.error(`DB error getting work points for member: ${e}`);
        throw new Error('internal server error');
    }
    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        total: results[0].total_points,
    };
}

// eslint-disable-next-line max-len
export async function getWorkPointsByMembership(membershipId: number, year: number, tenantId: string): Promise<WorkPoints> {
    const values = [membershipId, year, tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(GET_WORK_POINTS_BY_MEMBERSHIP_SQL, values);
    } catch (e) {
        logger.error(`DB error getting work points for membership: ${e}`);
        throw new Error('internal server error');
    }

    let total = 0;
    if (!_.isEmpty(results)) {
        total = results[0].total_points;
    }

    return {
        total,
    };
}

export async function getWorkPointsList(year: number, tenantId: string): Promise<WorkPoints[]> {
    const sql = `select b.last_name, b.first_name, m.membership_type, b.points_earned from
    v_bill b, v_member m where b.year = ? and m.membership_id = b.membership_id and
    m.membership_admin_id = m.member_id and m.tenant_id = ?
    order by last_name, first_name`;

    let results = [];
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, [year, tenantId]);
    } catch (error) {
        logger.error('Error accessing current member points list');
        logger.error(error);
        throw error;
    }
    return results.map((result) => ({
        tenantId: result.tenant_id,
        firstName: result.first_name,
        lastName: result.last_name,
        membershipType: result.membership_type,
        total: result.points_earned,
    }));
}
