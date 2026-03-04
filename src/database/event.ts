import _ from 'lodash';
import { OkPacket, RowDataPacket } from 'mysql2';
import { addDays, format, parse } from 'date-fns';

import logger from '../logger';
import { getPool } from './pool';
import { Event, PatchEventRequest, PostNewEventRequest } from '../typedefs/event';

export const INSERTED_EVENT_ID_OUT = '@event_id';
export const INSERT_EVENT_SQL = `CALL sp_event_job_generation(?, ?, ?, ?, ?, ?, ?, ${INSERTED_EVENT_ID_OUT})`;
export const GET_INSERTED_EVENT_ID_SQL = `SELECT ${INSERTED_EVENT_ID_OUT}`;
export const GET_EVENT_LIST_SQL = 'SELECT * FROM v_event';
export const GET_EVENT_LIST_DATERANGE_SQL = `${GET_EVENT_LIST_SQL} WHERE end >= ? and tenant_id = ? order by start`;
export const GET_EVENT_SQL = `${GET_EVENT_LIST_SQL} WHERE event_id = ?`;

export async function insertEvent(tenantId:string, req: PostNewEventRequest): Promise<number> {
    let restrict = 0;
    if (req.restrictSignups) restrict = 1;
    const values = [req.startDate, req.endDate, req.eventTypeId, req.eventName,
        req.eventDescription, restrict, tenantId];

    // Use a single connection for sequential queries with SQL variables
    // (variables are session-scoped)
    const conn = await getPool().getConnection();
    try {
        try {
            await conn.query<OkPacket>(INSERT_EVENT_SQL, values);
        } catch (e: any) {
            if ('errno' in e) {
                switch (e.errno) {
                    case 1048: // non-null violation, missing a non-nullable column
                    case 1452: // FK violation - referenced is missing
                        logger.error(`User error inserting event in DB: ${e}`);
                        throw new Error('user input error');
                    default:
                        logger.error(`DB error inserting event: ${e}`);
                        throw new Error('internal server error');
                }
            } else {
                // this should not happen - errors from query should always have 'errno' field
                throw e;
            }
        }

        let results;
        try {
            [results] = await conn.query<RowDataPacket[]>(GET_INSERTED_EVENT_ID_SQL);
        } catch (e) {
            logger.error(`DB error getting event ID after creation: ${e}`);
            throw new Error('internal server error');
        }

        return results[0][INSERTED_EVENT_ID_OUT];
    } finally {
        conn.release();
    }
}

export async function getEventList(tenantId:string, startDate?: string, endDate?: string): Promise<Event[]> {
    let sql;
    let values: string[];
    let sDate: string;
    let eDate: string;
    if (typeof startDate !== 'undefined' || typeof endDate !== 'undefined') {
        if (typeof startDate !== 'undefined') {
            sDate = startDate;
        } else {
            sDate = '1990-01-01';
        }
        if (typeof endDate !== 'undefined') {
            eDate = endDate;
        } else {
            eDate = sDate;
        }
        sql = GET_EVENT_LIST_DATERANGE_SQL;
        values = [sDate, tenantId];
    } else {
        sql = `${GET_EVENT_LIST_SQL} where tenant_id = ? order by start`;
        values = [tenantId];
    }

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting event list: ${e}`);
        throw new Error('internal server error');
    }

    return results.map((result) => ({
        eventId: result.event_id,
        tenantId: result.tenant_id,
        eventTypeId: result.event_type_id,
        start: result.start,
        end: result.end,
        eventType: result.event_type,
        title: result.title,
        eventDescription: result.event_description,
        restrictSignups: (result.restrict_signups === 1),
    }));
}

export async function getEvent(id: number, tenantId: string): Promise<Event> {
    const values = [id, tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(
            'select * from v_event where event_id = ? and tenant_id = ?',
            values,
        );
    } catch (e) {
        logger.error(`DB error getting event: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        eventId: results[0].event_id,
        tenantId: results[0].tenant_id,
        start: results[0].start,
        end: results[0].end,
        eventTypeId: results[0].event_type_id,
        eventType: results[0].event_type,
        title: results[0].title,
        eventDescription: results[0].event_description,
        restrictSignups: (results[0].restrict_signups === 1),
    };
}

export async function getClosestEvent(tenantId: string): Promise<Event> {
    let results;
    try {
        // eslint-disable-next-line max-len
        [results] = await getPool().query<RowDataPacket[]>('select * from v_event where tenant_id = ? and start >= now() order by start limit 1', [tenantId]);
    } catch (e) {
        logger.error(`DB error getting event: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        eventId: results[0].event_id,
        tenantId: results[0].tenant_id,
        start: results[0].start,
        end: results[0].end,
        eventType: results[0].event_type,
        eventTypeId: results[0].event_type_id,
        title: results[0].title,
        eventDescription: results[0].event_description,
        restrictSignups: (results[0].restrict_signups === 1),
    };
}

export async function patchEvent(id: number, tenantId: string, req: PatchEventRequest): Promise<void> {
    if (_.isEmpty(req)) {
        throw new Error('user input error');
    }
    let restrict = 0;
    if (req.restrictSignups) restrict = 1;
    const values = [req.startDate, req.endDate, req.eventName, req.eventDescription, restrict, id, tenantId];

    const updateSql =
        // eslint-disable-next-line max-len
        'update event set start_date = ?, end_date = ?, event_name = ?, event_description = ?, restrict_signups = ? where event_id = ? and tenant_id = ?';

    let result;
    try {
        [result] = await getPool().query<OkPacket>(updateSql, values);
    } catch (e) {
        logger.error(`DB error patching event: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        logger.info('this is happening');
        throw new Error('not found');
    }
}

export async function deleteEvent(id: number, tenantId: any): Promise<void> {
    const values = [id, tenantId];

    let result;
    try {
        await getPool().query('DELETE FROM job where event_id = ? and tenant_id = ? AND verified = 0;', values);
        await getPool().query('UPDATE job set event_id = null where event_id = ? and tenant_id = ?', values);
        [result] = await getPool().query<OkPacket>('DELETE FROM event where event_id = ? and tenant_id = ?', values);
    } catch (e) {
        logger.error(`DB error deleting event: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}

export async function getRelatedEvents(tenantId: string, event: Event) {
    const values = [event.eventTypeId, tenantId];

    const relatedEventSql =
        `select 
        etr.related_event_type_id, etr.day_difference, etr.description,
        et.type, et.default_start, et.default_end
        from
        event_type_relationship etr, event_type et
        where etr.event_type_id = ? and et.tenant_id = ? and
        et.event_type_id = etr.related_event_type_id order by etr.day_difference`;

    let relatedEventResults;
    try {
        [relatedEventResults] = await getPool().query<RowDataPacket[]>(relatedEventSql, values);
    } catch (e) {
        throw new Error('internal server error');
    }
    const relatedEvents: PostNewEventRequest[] = [];
    relatedEventResults.forEach((related) => {
        let startDate = parse(event.start.toString(), 'yyyy-MM-dd HH:mm:ss', new Date());
        let endDate = parse(event.start.toString(), 'yyyy-MM-dd HH:mm:ss', new Date());
        startDate = addDays(startDate, related.day_difference);
        endDate = addDays(endDate, related.day_difference);
        const defaultStart = related.default_start.split(':');
        startDate.setHours(defaultStart[0]);
        startDate.setMinutes(defaultStart[1]);
        startDate.setSeconds(defaultStart[2]);
        const defaultEnd = related.default_end.split(':');
        endDate.setHours(defaultEnd[0]);
        endDate.setMinutes(defaultEnd[1]);
        endDate.setSeconds(defaultEnd[2]);
        const precedingEvent = {
            tenantId: event.tenantId,
            startDate: format(startDate, "yyyy-MM-dd'T'HH:mm:ss"),
            endDate: format(endDate, "yyyy-MM-dd'T'HH:mm:ss"),
            eventTypeId: related.related_event_type_id,
            eventName: `${event.title} - ${related.type}`,
            eventDescription: `${event.title} - ${related.type}`,
            restrictSignups: event.restrictSignups,
        };
        relatedEvents.push(precedingEvent);
    });
    return relatedEvents;
}
