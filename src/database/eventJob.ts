import _ from 'lodash';
import { OkPacket, RowDataPacket } from 'mysql2';

import logger from '../logger';
import { getPool } from './pool';
import { EventJob, PatchEventJobRequest, PostNewEventJobRequest } from '../typedefs/eventJob';
import { PostNewJobRequest } from '../typedefs/job';
import { insertJob } from './job';
import { getEventList } from './event';
import { getJobType } from './jobType';
import { calculateStartDate } from '../util/dateHelper';

export const GET_EVENT_JOB_SQL = 'SELECT * FROM v_event_job WHERE event_job_id = ? AND tenant_id = ?';

export async function insertEventJob(req: PostNewEventJobRequest, tenantId: string): Promise<number> {
    if (_.isEmpty(req)) {
        throw new Error('user input error');
    }
    const values = [req.eventTypeId, tenantId, req.jobTypeId, req.count];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(
            'INSERT INTO event_job (event_type_id, tenant_id, job_type_id, count) VALUES (?, ?, ?, ?)',
            values,
        );
    } catch (e: any) {
        if ('errno' in e) {
            switch (e.errno) {
                case 1452: // FK violation - referenced is missing
                    logger.error(`User error inserting event-job in DB: ${e}`);
                    throw new Error('user input error');
                default:
                    logger.error(`DB error inserting event-job: ${e}`);
                    throw new Error('internal server error');
            }
        } else {
            // this should not happen - errors from query should always have 'errno' field
            throw e;
        }
    }
    // first get all the events
    let upcomingEvents = await getEventList(tenantId);
    upcomingEvents = upcomingEvents.filter((event) => event.eventTypeId === req.eventTypeId);
    upcomingEvents.forEach(async (event) => {
        // now for each event, insert the job for that event
        // "2022-06-21 09:30:00"
        const jobType = await getJobType(req.jobTypeId, tenantId);
        const jobDate = calculateStartDate(event.start.toString(), jobType.jobDayNumber);
        const newJob: PostNewJobRequest = {
            eventId: event.eventId,
            jobTypeId: req.jobTypeId,
            jobStartDate: jobDate,
            jobEndDate: jobDate,
            pointsAwarded: jobType.pointValue,
            cashPayout: jobType.cashValue,
            mealTicket: jobType.mealTicket,
            modifiedBy: 530,
            verified: true,
            paid: false,
        };
        // this syntax lets all the promises fire at the same time and then awaits them all.  This is some
        // high performance paralellism that we totally don't need here.   I kind of hate it because the clarity
        // quite frankly sucks as it looks like no other language.  But, eslint suggested it so I gave it a shot.
        // YAY for learning new things!
        const insertPromises = [];
        for (let index = 0; index < req.count; index++) {
            insertPromises.push(insertJob(tenantId, newJob));
        }
        await Promise.all(insertPromises);
    });
    return result.insertId;
}

export async function getEventJob(id: number, tenantId: string): Promise<EventJob> {
    const values = [id, tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(GET_EVENT_JOB_SQL, values);
    } catch (e) {
        logger.error(`DB error getting event-job: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        eventJobId: results[0].event_job_id,
        eventType: results[0].event_type,
        eventTypeId: results[0].event_type_id,
        jobTypeId: results[0].job_type_id,
        jobType: results[0].job_type,
        count: results[0].count,
    };
}

// eslint-disable-next-line max-len
export async function addJobTypeEvents(jobCountDiff: any, row: RowDataPacket, jobTypeId: number, modifiedBy: number, tenantId: string) {
    logger.info('Adding jobs for an event type as the count was changed.');
    for (let index = 0; index < jobCountDiff; index++) {
        const newJob: PostNewJobRequest = {
            eventId: row.event_id,
            jobTypeId,
            tenantId,
            jobStartDate: calculateStartDate(row.start, row.job_day_number),
            jobEndDate: calculateStartDate(row.start, row.job_day_number),
            pointsAwarded: row.points_awarded,
            cashPayout: row.cash_payout,
            mealTicket: (row.meal_ticket[0] === 1),
            modifiedBy,
            verified: true,
            paid: false,
        };
        try {
            // eslint-disable-next-line no-await-in-loop
            const insertedJob = await insertJob(tenantId, newJob);
            logger.info(`inserted job with ID ${insertedJob} for event with id ${row.event_id}`);
        } catch (e: any) {
            logger.error(e);
            throw e;
        }
    }
}

export async function removeJobTypeEvents(row: RowDataPacket, jobTypeId: number, tenantId: string) {
    logger.info('Removing jobs for an event type as the count was changed.');
    // bring some positivity in the world, no reason to be so negative!
    const removalCount = row.difference * -1;
    for (let index = 0; index < removalCount; index++) {
        const deleteSql =
            'delete from job where event_id = ? and job_type_id = ? and member_id is null and tenant_id = ? limit 1';
        try {
            // eslint-disable-next-line no-await-in-loop
            const [removeResults] = await getPool().query<OkPacket>(deleteSql, [row.event_id, jobTypeId, tenantId]);
            logger.info(`removed one job with id ${jobTypeId} for event id ${row.event_id}`);
            logger.info(removeResults.affectedRows);
        } catch (error: any) {
            logger.error(error);
            throw error;
        }
    }
}

export async function updateJobsOnEventJob(id: number, tenantId: string, req: PatchEventJobRequest): Promise<number> {
    let results;
    let changedCount = 0;
    try {
        const countSql = `select distinct(event), event_id, job_type_id, start, end, points_awarded, cash_payout,
            meal_ticket, count(*) job_count, (?)-count(*) difference
            from v_job where tenant_id = ? and event_type_id = ? and job_type_id = ?
            and start > date_sub(now(), interval 7 day)
            group by event`;
        const params = [req.count, tenantId, req.eventTypeId, req.jobTypeId];
        [results] = await getPool().query<RowDataPacket[]>(countSql, params);
        results.forEach(async (row) => {
            const jobCountDiff = row.difference;
            if (jobCountDiff > 0) {
                await addJobTypeEvents(jobCountDiff, row, req.jobTypeId as number, req.modifiedBy as number, tenantId);
            } else if (jobCountDiff < 0) {
                await removeJobTypeEvents(row, req.jobTypeId as number, tenantId);
            } else {
                logger.info('Called jobs update but there was no count change so count update was not done.');
            }
            changedCount++;
        });
    } catch (e: any) {
        logger.error('unable to update jobs on event job change', e);
    }
    return changedCount;
}

export async function patchEventJob(id: number, tenantId: string, req: PatchEventJobRequest): Promise<void> {
    if (_.isEmpty(req)) {
        throw new Error('user input error');
    }
    const values = [req.eventTypeId, req.jobTypeId, req.count, id, tenantId];

    let result;
    try {
        // eslint-disable-next-line max-len
        const updateSql = 'update event_job set event_type_id = ?, job_type_id = ?, count = ? where event_job_id = ? and tenant_id = ?';
        [result] = await getPool().query<OkPacket>(updateSql, values);
    } catch (e: any) {
        if ('errno' in e) {
            switch (e.errno) {
                case 1451: // FK violation - referenced somewhere else
                case 1452: // FK violation - referenced is missing
                    logger.error(`User error patching event-job in DB: ${e}`);
                    throw new Error('user input error');
                default:
                    logger.error(`DB error patching event-job: ${e}`);
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
    const changedJobs = await updateJobsOnEventJob(id, tenantId, req);
    logger.info(`Added or removed ${changedJobs} jobs while doing an update to eventJob`);
}

export async function deleteEventJob(id: number, tenantId: string): Promise<void> {
    const values = [id, tenantId];

    let result;
    try {
        // get the job right before deleting it so we know what it is. it's a
        // ghooooooooooost job.
        const eventJob = await getEventJob(id, tenantId);
        [result] = await getPool().query<OkPacket>(
            'delete from event_job where event_job_id = ? and tenant_id = ?',
            values,
        );
        const [deleteJobsResult] = await getPool()
            // eslint-disable-next-line max-len
            .query<OkPacket>('delete from job where tenant_id = ? and job_type_id = ? and job_start_date > now()', [tenantId, eventJob.jobTypeId]);
        logger.info(`removed job id ${id} from jobs table`);
        logger.info(`${deleteJobsResult.affectedRows} rows in jobs affected`);
    } catch (e) {
        logger.error(`DB error deleting event-job: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}
