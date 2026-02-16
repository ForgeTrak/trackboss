import { apiRequest } from './utils';
import { RidingAreaStatus } from '../../../src/typedefs/ridingAreaStatus';

export function getRidingAreaStatuses(token: string): Promise<RidingAreaStatus[]> {
    return apiRequest(token, 'GET', '/api/ridingAreaStatus');
}

export function updateRidingAreaStatus(
    token: string,
    areaId: number,
    ridingAreaData: RidingAreaStatus,
): Promise<RidingAreaStatus> {
    return apiRequest(token, 'PATCH', `/api/ridingAreaStatus/${areaId}`, ridingAreaData);
}
