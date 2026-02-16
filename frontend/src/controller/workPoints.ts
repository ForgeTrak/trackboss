import { apiRequest, apiRequestBlob } from './utils';
import {
    GetMembershipWorkPointsResponse,
    GetMemberWorkPointsResponse,
    WorkPoints,
} from '../../../src/typedefs/workPoints';
import { ErrorResponse } from '../../../src/typedefs/errorResponse';

function isWorkPoints(res: WorkPoints | ErrorResponse): res is WorkPoints {
    return (res as WorkPoints) !== undefined;
}

export function getWorkPointsByMember(
    token: string,
    memberId: number,
    year?: number,
): Promise<GetMemberWorkPointsResponse> {
    const path = typeof year === 'undefined'
        ? `/api/workPoints/byMember/${memberId}`
        : `/api/workPoints/byMember/${memberId}?year=${year}`;
    return apiRequest(token, 'GET', path);
}

export function getWorkPointsByMembership(token: string, membershipId: number, year?: number):
    Promise<GetMembershipWorkPointsResponse> {
    const path = typeof year === 'undefined'
        ? `/api/workPoints/byMembership/${membershipId}`
        : `/api/workPoints/byMembership/${membershipId}?year=${year}`;
    return apiRequest(token, 'GET', path);
}

export async function getWorkPointsTotal(token: string, membershipId: number) {
    const workPointsResponse = await getWorkPointsByMembership(token, membershipId);
    if (isWorkPoints(workPointsResponse)) {
        return workPointsResponse.total;
    }

    // else
    return undefined;
}

export function getMemberPointsExcel(token: string): Promise<Blob> {
    return apiRequestBlob(token, '/api/workPoints/list/excel');
}

export function getEligibleVoters(token: string): Promise<Blob> {
    return apiRequestBlob(token, '/api/member/list/voterEligibility/excel');
}
