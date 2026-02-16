import { apiRequest, apiRequestNoAuth } from './utils';
import {
    GetMembershipListResponse,
    GetMembershipResponse,
    PatchMembershipRequest,
    PatchMembershipResponse,
    PostNewMembershipRequest,
    PostNewMembershipResponse,
    PostRegisterMembershipResponse,
    PostRegisterMembershipRequest,
} from '../../../src/typedefs/membership';

export function createMembership(
    token: string,
    memberData: PostNewMembershipRequest,
): Promise<PostNewMembershipResponse> {
    return apiRequest(token, 'POST', '/api/membership/new', memberData, { mode: 'no-cors' });
}

export function getMembershipList(token: string, listType?: string): Promise<GetMembershipListResponse> {
    const path = listType ? `/api/membership/list?status=${listType}` : '/api/membership/list';
    return apiRequest(token, 'GET', path, undefined, { mode: 'no-cors' });
}

export function getMembership(token: string, membershipID: number): Promise<GetMembershipResponse> {
    return apiRequest(token, 'GET', `/api/membership/${membershipID}`, undefined, { mode: 'no-cors' });
}

export function updateMembership(
    token: string,
    membershipID: number,
    memberData: PatchMembershipRequest,
): Promise<PatchMembershipResponse> {
    return apiRequest(token, 'PATCH', `/api/membership/${membershipID}`, memberData);
}

export function registerMembership(
    registrationData: PostRegisterMembershipRequest,
): Promise<PostRegisterMembershipResponse> {
    return apiRequestNoAuth('POST', '/api/membership/register', registrationData, {
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
    });
}
