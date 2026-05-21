import { apiRequest } from './utils';
import {
    DeleteBikeResponse,
    GetBikeListResponse,
    GetBikeResponse,
    PatchBikeRequest,
    PatchBikeResponse,
    PostNewBikeRequest,
    PostNewBikeResponse,
} from '../../../src/typedefs/bike';

export function createBike(token: string, bikeData: PostNewBikeRequest): Promise<PostNewBikeResponse> {
    return apiRequest(token, 'POST', '/api/bike/new', bikeData);
}

export function getBikeList(token: string, membershipID?: number): Promise<GetBikeListResponse> {
    const path = membershipID
        ? `/api/bike/list?membershipID=${membershipID}`
        : '/api/bike/list';
    return apiRequest(token, 'GET', path);
}

export function getBike(token: string, bikeID: number): Promise<GetBikeResponse> {
    return apiRequest(token, 'GET', `/api/bike/${bikeID}`);
}

export function updateBike(
    token: string,
    bikeID: number,
    bikeData: PatchBikeRequest,
): Promise<PatchBikeResponse> {
    return apiRequest(token, 'PATCH', `/api/bike/${bikeID}`, bikeData);
}

export function deleteBike(token: string, bikeID: number): Promise<DeleteBikeResponse> {
    return apiRequest(token, 'DELETE', `/api/bike/${bikeID}`);
}
