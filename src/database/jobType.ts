import _ from 'lodash';
import { OkPacket, RowDataPacket } from 'mysql2';

import logger from '../logger';
import { getPool } from './pool';
import { JobType, PatchJobTypeRequest, PostNewJobTypeRequest } from '../typedefs/jobType';

export const INSERT_JOB_TYPE_SQL = 'INSERT INTO job_type (tenant_id, title, point_value, cash_value, job_day_number, ' +
    'active, reserved, online, meal_ticket, sort_order, last_modified_date, last_modified_by)' +
    'VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, CURDATE(), ?)';

const jobDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function insertJobType(tenantId: string, req: PostNewJobTypeRequest): Promise<number> {
    const values = [
        tenantId,
        req.title,
        req.pointValue,
        req.cashValue,
        req.jobDayNumber,
        req.reserved,
        req.online,
        req.mealTicket,
        req.sortOrder,
        req.modifiedBy,
    ];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(INSERT_JOB_TYPE_SQL, values);
    } catch (e: any) {
        if ('errno' in e) {
            switch (e.errno) {
                case 1048: // non-null violation, missing a non-nullable column
                case 1452: // FK violation - referenced is missing
                    logger.error(`User error inserting job type in DB: ${e}`);
                    throw new Error('user input error');
                default:
                    logger.error(`DB error inserting job type: ${e}`);
                    throw new Error('internal server error');
            }
        } else {
            // this should not happen - errors from query should always have 'errno' field
            throw e;
        }
    }

    return result.insertId;
}

export async function getJobType(id: number, tenantId:string): Promise<JobType> {
    const values = [id, tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(
            'select * from job_type where job_type_id = ? and tenant_id = ?',
            values,
        );
    } catch (e) {
        logger.error(`DB error getting job type: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        jobTypeId: results[0].job_type_id,
        tenantId: results[0].tenant_id,
        title: results[0].title,
        pointValue: results[0].point_value,
        cashValue: results[0].cash_value,
        jobDayNumber: results[0].job_day_number,
        jobDay: jobDays[results[0].job_day_number],
        active: !!results[0].active[0],
        reserved: !!results[0].reserved[0],
        online: !!results[0].online[0],
        mealTicket: !!results[0].meal_ticket[0],
        sortOrder: results[0].sort_order,
        lastModifiedDate: results[0].last_modified_date,
        lastModifiedBy: results[0].last_modified_by,
    };
}

export async function getJobTypeList(tenantId: string): Promise<JobType[]> {
    const sql = 'select * from job_type where tenant_id = ?';
    const values: string[] = [tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting job type list: ${e}`);
        throw e;
    }
    return results.map((result) => ({
        jobTypeId: result.job_type_id,
        tenantId: result.tenant_id,
        title: result.title,
        pointValue: result.point_value,
        cashValue: result.cash_value,
        jobDayNumber: result.job_day_number,
        jobDay: jobDays[result.job_day_number],
        active: !!result.active[0],
        reserved: !!result.reserved[0],
        online: !!result.online[0],
        mealTicket: !!result.meal_ticket[0],
        sortOrder: result.sort_order,
        lastModifiedDate: result.last_modified_date,
        lastModifiedBy: result.last_modified_by,
    }));
}

export async function getJobTypesEventList(tenantId: string, eventTypeName : string) : Promise<JobType[]> {
    const sql = `select jt.*, ej.event_job_id, ej.count from job_type jt, event_job ej, event_type et
    where et.type = ? and ej.event_type_id = et.event_type_id and
    ej.job_type_id = jt.job_type_id order by jt.job_day_number, jt.job_type_id`;

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, [eventTypeName]);
    } catch (e) {
        logger.error(`DB error getting job type list: ${e}`);
        throw new Error('internal server error');
    }
    // this is a hackaroo job, but this is OK since it's a small query and I can fix it later if it's fukt.
    results = results.filter((result) => result.tenant_id === tenantId);
    return results.map((result) => ({
        jobTypeId: result.job_type_id,
        tenantId: result.tenant_id,
        title: result.title,
        pointValue: result.point_value,
        cashValue: result.cash_value,
        jobDayNumber: result.job_day_number,
        jobDay: jobDays[result.job_day_number],
        active: !!result.active[0],
        reserved: !!result.reserved[0],
        online: !!result.online[0],
        mealTicket: !!result.meal_ticket[0],
        sortOrder: result.sort_order,
        count: result.count,
        eventJobId: result.event_job_id,
        lastModifiedDate: result.last_modified_date,
        lastModifiedBy: result.last_modified_by,
    }));
}

export async function patchJobType(tenantId:string, id: number, req: PatchJobTypeRequest): Promise<void> {
    if (_.isEmpty(req)) {
        throw new Error('user input error');
    }

    const existingJobType = await getJobType(id, tenantId);
    // check the values to see if they are set, and if not, set them. This is good practice that makes
    // this a true "PATCH"
    // eslint-disable-next-line no-restricted-syntax

    const values = [
        req.title,
        req.pointValue,
        req.cashValue,
        req.jobDayNumber,
        req.reserved,
        req.online,
        req.mealTicket,
        req.sortOrder,
        req.active,
        req.modifiedBy,
        id,
        tenantId,
    ];

    let result;
    try {
        const updateSql = `update job_type set title = ?, point_value = ?, cash_value = ?, job_day_number = ?,
            reserved = ?, online = ?, meal_ticket = ?, sort_order = ?, active = ?, last_modified_by = ?,
            last_modified_date = NOW() where job_type_id = ? and tenant_id = ?
        `;
        [result] = await getPool().query<OkPacket>(updateSql, values);
        logger.info(`updated job: ${JSON.stringify(req)} in job type database`);
        logger.info(`${result.affectedRows} were updated`);
        // also update any future jobs in the job table that already have this info on them (use case: calendar
        // already made for the year, and now we want to change the point value).
        const jobUpdateSql = `update job set points_awarded = ?, cash_payout = ? 
            where tenant_id = ? and job_type_id = ? and job_start_date > date_sub(now(), interval 7 day)`;
        // eslint-disable-next-line max-len
        const [jobUpdateResult] = await getPool().query<OkPacket>(jobUpdateSql, [req.pointValue, req.cashValue, tenantId, id]);
        logger.info(`updated job: ${JSON.stringify(req)} in future jobs table`);
        logger.info(`${jobUpdateResult.affectedRows} were updated`);
    } catch (e: any) {
        if ('errno' in e) {
            switch (e.errno) {
                case 1451: // FK violation - referenced somewhere else
                case 1452: // FK violation - referenced is missing
                    logger.error(`User error patching job type in DB: ${e}`);
                    throw new Error('user input error');
                default:
                    logger.error(`DB error patching job type: ${e}`);
                    throw new Error('internal server error');
            }
        } else {
            // this should not happen - errors from query should always have 'errno' field
            throw e;
        }
    }

    if (result.affectedRows < 1) {
        const errorMessage = `The job type with id ${id} was not found so it cant' be updated.  Check that it exists.`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }
}
