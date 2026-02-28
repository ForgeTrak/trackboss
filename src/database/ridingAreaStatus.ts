import { OkPacket, RowDataPacket } from 'mysql2';
import { RidingAreaStatus } from '../typedefs/ridingAreaStatus';

import logger from '../logger';
import { getPool } from './pool';

/**
 * Get all the riding area statuses.
 */
export async function getRidingAreaStatuses(tenantId: string): Promise<RidingAreaStatus[]> {
    // this just pulls eveyrthing, but there are only 3 rows as of 8/2022.  I can't forsee
    // there ever being more than that, maybe 4 tops one day.  But taht would require changing
    // the UI also.
    const sql = 'select * from riding_area_status where tenant_id = ?';
    const values: string[] = [tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting riding area statuses list: ${e}`);
        throw new Error('internal server error');
    }
    return results.map((result) => ({
        id: result.riding_area_status_id,
        name: result.area_name,
        isOpen: (result.status[0] === 1),
    }));
}

export async function flipRidingAreaStatus(id: number, status: any, tenantId: string) : Promise<RidingAreaStatus> {
    const sql = 'update riding_area_status set status = ? where riding_area_status_id = ? and tenant_id = ?';
    let results;
    try {
        [results] = await getPool().query<OkPacket>(sql, [Number(status.isOpen), id, tenantId]);
    } catch (error: any) {
        logger.error('Error updating riding area status');
        logger.error(error);
    }
    return status;
}
