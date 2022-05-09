import _ from 'lodash';
import { OkPacket, RowDataPacket } from 'mysql2';
import member from 'src/api/member';

import { Job, PatchJobRequest, PostNewJobRequest, GetJobListRequestFilters } from 'src/typedefs/job';

import logger from '../logger';
import { getPool } from './pool';

export const GET_JOB_LIST_SQL = 'SELECT * FROM v_job';
export const GET_JOB_SQL = `${GET_JOB_LIST_SQL} WHERE job_id = ?`;
export const INSERT_JOB_SQL = 'INSERT INTO job (member_id, event_id, job_type_id, job_start_date, job_end_date, ' +
     ' last_modified_date, verified, verified_date, points_awarded, paid, paid_date, last_modified_by) ' +
     'VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)';
export const PATCH_JOB_SQL = 'CALL sp_patch_job(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
export const DELETE_JOB_SQL = 'DELETE FROM job WHERE job_id = ?';

export async function insertJob(req: PostNewJobRequest): Promise<number> {
    if (_.isEmpty(req)) {
        throw new Error('user input error');
    }
    const values = [req.memberId, req.eventId, req.jobTypeId, req.jobStartDate, req.jobEndDate, req.verified,
        req.verifiedDate, req.pointsAwarded, req.paid, req.paidDate, req.modifiedBy];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(INSERT_JOB_SQL, values);
    } catch (e: any) {
        if ('errno' in e) {
            switch (e.errno) {
                case 1452: // FK violation - referenced is missing
                    logger.error(`User error inserting job in DB: ${e}`);
                    throw new Error('user input error');
                default:
                    logger.error(`DB error inserting job: ${e}`);
                    throw new Error('internal server error');
            }
        } else {
            // this should not happen - errors from query should always have 'errno' field
            throw e;
        }
    }

    return result.insertId;
}

export async function getJobList(filters: GetJobListRequestFilters): Promise<Job[]> {
    let sql;
    let values: any[] = [];
    let useMemberFilter = false;
    let memberId = -1;
    if (!_.isEmpty(filters)) {
        let dynamicSql = ' WHERE ';
        let counter = 0;
        useMemberFilter = (typeof filters.memberId !== 'undefined');
        if (typeof filters.assignmentStatus !== 'undefined') {
            if (filters.assignmentStatus) {
                dynamicSql += 'member IS NOT NULL AND ';
            } else {
                dynamicSql += 'member IS NULL AND ';
            }
        }
        if (typeof filters.verificationStatus !== 'undefined') {
            dynamicSql += 'verified = ? AND ';
            values[counter++] = filters.verificationStatus;
        }
        if (useMemberFilter) {
            memberId = filters.memberId || -1;
            dynamicSql += 'member_id = ? AND ';
            values[counter++] = filters.memberId;
        }
        if (typeof filters.membershipId !== 'undefined') {
            dynamicSql += 'membership_id = ? AND ';
            values[counter++] = filters.membershipId;
        }
        if (typeof filters.eventId !== 'undefined') {
            dynamicSql += 'event_id = ? AND ';
            values[counter++] = filters.eventId;
        }
        if (typeof filters.startDate !== 'undefined') {
            dynamicSql += 'start >= ? AND ';
            values[counter++] = filters.startDate;
        }
        if (typeof filters.endDate !== 'undefined') {
            dynamicSql += 'start <= ? AND ';
            values[counter++] = filters.endDate;
        }
        sql = GET_JOB_LIST_SQL + dynamicSql.slice(0, -4); // Slice the trailing AND
    } else {
        sql = GET_JOB_LIST_SQL;
        values = [];
    }
    sql += ' order by job_day_number, sort_order';
    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting job list: ${e}`);
        throw new Error('internal server error');
    }
    const jobDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const jobResults : any = results.map((result) => ({
        jobId: result.job_id,
        member: result.member,
        memberId: result.member_id,
        membershipId: result.membership_id,
        eventId: result.event_id,
        event: result.event,
        start: result.start,
        end: result.end,
        title: result.title,
        verified: !!result.verified[0],
        verifiedDate: result.verified_date,
        pointsAwarded: result.points_awarded,
        paid: !!result.verified[0],
        cashPayout: result.cash_payout,
        paidDate: result.paid_date,
        jobDay: jobDays[result.job_day_number],
        sortOrder: result.sort_order,
        jobDayNumber: result.job_day_number,
        mealTicket: ((result.meal_ticket[0] === 1) ? 'Yes' : 'No'),
        lastModifiedDate: result.last_modified_date,
        lastModifiedBy: result.last_modified_by,
    }));
    if (useMemberFilter && memberId > 0) {
        const historicalResults = await getPool().query<RowDataPacket[]>(
            `select 
              m.member_id, m.membership_id, concat(m.first_name, ' ', m.last_name) member, eph.date, 
              eph.description title, eph.point_value points_awarded
              from member m, earned_points_history eph where 
              eph.old_member_id = m.old_member_id and 
              m.member_id = ?`,
            [memberId],
        );
        // eslint-disable-next-line no-self-compare
        const historicalJobs = historicalResults[0].map((legacyPoints) => (jobResults.push({
            member: legacyPoints.member,
            memberId: legacyPoints.member_id,
            membershipId: legacyPoints.membership_id,
            start: legacyPoints.date,
            end: legacyPoints.date,
            title: legacyPoints.title,
            verified: true,
            pointsAwarded: legacyPoints.points_awarded,
            paid: false,
            cashPayout: 0,
        })
        ));
        jobResults.push(historicalJobs);
    }
    return jobResults;
}

export async function getJob(id: number): Promise<Job> {
    const values = [id];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(GET_JOB_SQL, values);
    } catch (e) {
        logger.error(`DB error getting job: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        jobId: results[0].job_id,
        member: results[0].member,
        memberId: results[0].member_id,
        membershipId: results[0].membership_id,
        eventId: results[0].event_id,
        event: results[0].event,
        start: results[0].start,
        end: results[0].end,
        title: results[0].title,
        verified: !!results[0].verified[0],
        verifiedDate: results[0].verified_date,
        pointsAwarded: results[0].points_awarded,
        paid: !!results[0].paid[0],
        paidDate: results[0].paid_date,
        cashPayout: results[0].cash_payout,
        mealTicket: results[0].meal_ticket,
        lastModifiedDate: results[0].last_modified_date,
        lastModifiedBy: results[0].last_modified_by,
    };
}

export async function patchJob(id: number, req: PatchJobRequest): Promise<void> {
    if (_.isEmpty(req)) {
        throw new Error('user input error');
    }
    const values = [id, req.memberId, req.eventId, req.jobTypeId, req.jobStartDate, req.jobEndDate,
        req.pointsAwarded, req.verified, req.paid, req.modifiedBy];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(PATCH_JOB_SQL, values);
    } catch (e: any) {
        if ('errno' in e) {
            switch (e.errno) {
                case 1451: // FK violation - referenced somewhere else
                case 1452: // FK violation - referenced is missing
                    logger.error(`User error patching member in DB: ${e}`);
                    throw new Error('user input error');
                default:
                    logger.error(`DB error patching member: ${e}`);
                    throw new Error('internal server error');
            }
        } else {
            // this should not happen - errors from query should always have 'errno' field
            throw e;
        }
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}

export async function setJobVerifiedState(id: number, state: boolean) : Promise<number> {
    const [result] = await getPool().query<OkPacket>(
        'update job set verified = ? where job_id = ?',
        [state, id],
    );
    return result.affectedRows;
}

export async function removeSignup(jobId: number) : Promise<number> {
    const [result] = await getPool().query<OkPacket>(
        'update job set member_id = null where job_id = ?',
        [jobId],
    );
    return result.affectedRows;
}

export async function deleteJob(id: number): Promise<void> {
    const values = [id];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(DELETE_JOB_SQL, values);
    } catch (e) {
        logger.error(`DB error deleting job: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}
