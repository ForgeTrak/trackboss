import { apiRequest, apiRequestNoAuth } from './utils';

import {
    GetMemberListResponse,
    GetMemberResponse,
    Member,
    PatchMemberRequest,
    PatchMemberResponse,
    PostNewMemberRequest,
    PostNewMemberResponse,
} from '../../../src/typedefs/member';

export function createMember(token: string, memberData: PostNewMemberRequest): Promise<PostNewMemberResponse> {
    return apiRequest(token, 'POST', '/api/member/new', memberData);
}

export function getMember(token: string, memberId: number): Promise<GetMemberResponse> {
    return apiRequest(token, 'GET', `/api/member/${memberId}`);
}

export function getFamilyMembers(token: string, membershipId: number): Promise<GetMemberListResponse> {
    return apiRequest(token, 'GET', `/api/member/list?membershipId=${membershipId}`);
}

export function getMemberList(token: string, listType?: string): Promise<GetMemberListResponse> {
    const path = listType ? `/api/member/list?status=${listType}` : '/api/member/list';
    return apiRequest(token, 'GET', path);
}

export function updateMember(
    token: string,
    memberID: number,
    memberData: PatchMemberRequest,
): Promise<PatchMemberResponse> {
    return apiRequest(token, 'PATCH', `/api/member/${memberID}`, memberData);
}

export function getMembersByMembership(token: string, membershipId: number): Promise<Member[]> {
    return apiRequest(token, 'GET', `/api/member/list?membershipId=${membershipId}`);
}

export function getMemberByEmail(token: string, email: string): Promise<Member> {
    return apiRequest(token, 'GET', `/api/member/email/${email}`);
}

export function memberExistsByEmail(email: string): Promise<any> {
    return apiRequestNoAuth('GET', `/api/member/email/exists/${email}`);
}

export function resetMemberPassword(token: string, memberId?: number): Promise<any> {
    return apiRequest(token, 'PUT', `/api/member/resetpassword/${memberId}`);
}
