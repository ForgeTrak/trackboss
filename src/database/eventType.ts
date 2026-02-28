import _ from 'lodash';
import { OkPacket, RowDataPacket } from 'mysql2';

import logger from '../logger';
import { getPool } from './pool';
import { EventType, PatchEventTypeRequest, PostNewEventTypeRequest } from '../typedefs/eventType';

export async function insertEventType(tenantId: string, req: PostNewEventTypeRequest): Promise<number> {
    const values = [req.type, req.modifiedBy, tenantId];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(
            // eslint-disable-next-line max-len
            'INSERT INTO event_type (type, last_modified_by, last_modified_date, active, tenant_id) VALUES (?, ?, CURDATE(), 1, ?)',
            values,
        );
    } catch (e: any) {
        if ('errno' in e) {
            switch (e.errno) {
                case 1048: // non-null violation, missing a non-nullable column
                case 1452: // FK violation - referenced is missing
                    logger.error(`User error inserting event type in DB: ${e}`);
                    throw new Error('user input error');
                default:
                    logger.error(`DB error inserting event type: ${e}`);
                    throw new Error('internal server error');
            }
        } else {
            // this should not happen - errors from query should always have 'errno' field
            throw e;
        }
    }

    return result.insertId;
}

export async function getEventType(id: number, tenantId: string): Promise<EventType> {
    const values = [id, tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(
            'select * from v_event_type where event_type_id = ? and tenant_id = ?',
            values,
        );
    } catch (e) {
        logger.error(`DB error getting event type: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        eventTypeId: results[0].event_type_id,
        tenantId: results[0].tenant_id,
        type: results[0].type,
        active: !!results[0].active[0],
        lastModifiedDate: results[0].last_modified_date,
        lastModifiedBy: results[0].last_modified_by,
        defaultEndTime: results[0].default_end,
        defaultStartTime: results[0].default_start,
    };
}

export async function getEventTypeList(tenantId: string): Promise<EventType[]> {
    const sql =
        // eslint-disable-next-line max-len
        'SELECT event_type_id, type, active, last_modified_by, last_modified_date FROM v_event_type where tenant_id = ? order by type';
    const values: string[] = [tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting event type list: ${e}`);
        throw new Error('internal server error');
    }
    return results.map((result) => ({
        eventTypeId: result.event_type_id,
        tenantId: result.tenant_id,
        type: result.type,
        lastModifiedBy: result.last_modified_by,
        lastModifiedDate: result.last_modified_date,
        active: !!result.active[0],
        defaultEndTime: result.default_end,
        defaultStartTime: result.default_start,
    }));
}

export async function patchEventType(id: number, tenantId: string, req: PatchEventTypeRequest): Promise<void> {
    if (_.isEmpty(req)) {
        throw new Error('user input error');
    }
    const values = [req.type, req.active, req.modifiedBy, id, tenantId];

    let result;
    try {
        // eslint-disable-next-line max-len
        const patchSql = 'update event_type set type = ?, active = ?, last_modified_by = ?, last_modified_date = CURDATE() where event_type_id = ? and tenant_id = ?';
        [result] = await getPool().query<OkPacket>(patchSql, values);
    } catch (e: any) {
        if ('errno' in e) {
            switch (e.errno) {
                case 1451: // FK violation - referenced somewhere else
                case 1452: // FK violation - referenced is missing
                    logger.error(`User error patching event type in DB: ${e}`);
                    throw new Error('user input error');
                default:
                    logger.error(`DB error patching event type: ${e}`);
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
