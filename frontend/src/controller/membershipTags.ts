import { apiRequest } from './utils';

import { MembershipTag } from '../../../src/typedefs/membershipTag';

export function getMembershipTags(token: string, id: number): Promise<MembershipTag[]> {
    return apiRequest(token, 'GET', `/api/membership/tags/${id}`);
}

export function addMembershipTags(
    token: string,
    membershipId: number,
    tags: string[],
): Promise<MembershipTag[]> {
    return apiRequest(token, 'POST', '/api/membership/tags', { membershipId, tags });
}

export function deleteMembershipTags(
    token: string,
    membershipId: number,
    tags: string[],
): Promise<MembershipTag[]> {
    return apiRequest(token, 'DELETE', '/api/membership/tags', { membershipId, tags });
}

export function getUniqueTags(token: string): Promise<MembershipTag[]> {
    return apiRequest(token, 'GET', '/api/membershipTags/unique');
}
