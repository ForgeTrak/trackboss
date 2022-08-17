import { OkPacket, RowDataPacket } from 'mysql2';
import { RidingAreaStatus } from '../typedefs/ridingAreaStatus';

import logger from '../logger';
import { getPool } from './pool';

/**
 * Get all the riding area statuses.
 */
export default async function getRidingAreaStatuses(): Promise<RidingAreaStatus[]> {
    // this just pulls eveyrthing, but there are only 3 rows as of 8/2022.  I can't forsee
    // there ever being more than that, maybe 4 tops one day.  But taht would require changing
    // the UI also.
    const sql = 'select * from riding_area_status';
    const values: string[] = [];

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
