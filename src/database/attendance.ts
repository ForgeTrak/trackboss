import { OkPacket, RowDataPacket } from 'mysql2';
import { Attendance, AttendanceCount } from '../typedefs/attendance';

import logger from '../logger';
import { getPool } from './pool';

/**
 * Check if a member has already checked in today.
 */
export async function hasCheckedInToday(memberId: number, tenantId: string): Promise<boolean> {
    const sql = `select count(*) as cnt from attendance
                 where tenant_id = ? and member_id = ? and date(check_in_time) = curdate()`;
    const values = [tenantId, memberId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error checking today's attendance for member ${memberId}: ${e}`);
        throw new Error('internal server error');
    }
    return results[0].cnt > 0;
}

/**
 * Check in a member (record attendance). Limited to one check-in per day.
 */
export async function checkInMember(memberId: number, membershipId: number, tenantId: string): Promise<Attendance> {
    const alreadyCheckedIn = await hasCheckedInToday(memberId, tenantId);
    if (alreadyCheckedIn) {
        throw new Error('already checked in today');
    }

    const sql = 'insert into attendance (tenant_id, member_id, membership_id, check_in_time) values (?, ?, ?, NOW())';
    const values = [tenantId, memberId, membershipId];

    let results;
    try {
        [results] = await getPool().query<OkPacket>(sql, values);
    } catch (e) {
        logger.error(`DB error inserting attendance record: ${e}`);
        throw new Error('internal server error');
    }
    return {
        attendanceId: results.insertId,
        memberId,
        membershipId,
        checkInTime: new Date().toISOString(),
    };
}

/**
 * Get attendance records for a specific member.
 */
export async function getAttendanceByMember(
    memberId: number,
    tenantId: string,
    year?: number,
): Promise<Attendance[]> {
    let sql = `select a.attendance_id, a.member_id, a.membership_id, a.check_in_time,
               concat(m.first_name, ' ', m.last_name) as member_name
               from attendance a
               join member m on a.member_id = m.member_id
               where a.tenant_id = ? and a.member_id = ?`;
    const values: (string | number)[] = [tenantId, memberId];

    if (year) {
        sql += ' and year(a.check_in_time) = ?';
        values.push(year);
    }
    sql += ' order by a.check_in_time desc';

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting attendance for member ${memberId}: ${e}`);
        throw new Error('internal server error');
    }
    return results.map((result) => ({
        attendanceId: result.attendance_id,
        memberId: result.member_id,
        membershipId: result.membership_id,
        memberName: result.member_name,
        checkInTime: result.check_in_time,
    }));
}

/**
 * Get attendance leaderboard - top members by check-in count for a given year.
 */
export async function getAttendanceLeaderboard(
    tenantId: string,
    year?: number,
): Promise<AttendanceCount[]> {
    const targetYear = year || new Date().getFullYear();
    const sql = `select a.member_id, a.membership_id, concat(m.first_name, ' ', m.last_name) as member_name,
                 count(*) as check_in_count
                 from attendance a
                 join member m on a.member_id = m.member_id
                 where a.tenant_id = ? and year(a.check_in_time) = ?
                 group by a.member_id, a.membership_id, m.first_name, m.last_name
                 order by check_in_count desc`;
    const values = [tenantId, targetYear];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting attendance leaderboard: ${e}`);
        throw new Error('internal server error');
    }
    return results.map((result) => ({
        memberId: result.member_id,
        membershipId: result.membership_id,
        memberName: result.member_name,
        checkInCount: result.check_in_count,
    }));
}
