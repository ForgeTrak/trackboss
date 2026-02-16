import { apiRequest, apiRequestBlob, apiRequestNoAuth } from './utils';

import { MembershipApplication } from '../../../src/typedefs/membershipApplication';

// eslint-disable-next-line import/prefer-default-export
export function getMembershipApplications(token: string, year: number): Promise<MembershipApplication[]> {
    return apiRequest(token, 'GET', `/api/membershipApplication?year=${year}`);
}

export function getMembershipApplication(
    token: string,
    id: number,
): Promise<MembershipApplication[]> {
    return apiRequest(token, 'GET', `/api/membershipApplication/${id}`);
}

export function applicationExists(email: string): Promise<any> {
    return apiRequestNoAuth('GET', `/api/membershipApplication/exists/${email}`);
}

export function acceptMembershipApplication(
    token: string,
    id: number,
    internalNotes: string,
    applicantNotes: string,
    isGuest?: boolean,
): Promise<MembershipApplication[]> {
    const path = isGuest
        ? `/api/membershipApplication/accept/${id}?guest=${isGuest}`
        : `/api/membershipApplication/accept/${id}`;
    return apiRequest(token, 'POST', path, { internalNotes, applicantNotes });
}

export function rejectMembershipApplication(
    token: string,
    id: number,
    internalNotes: string,
    applicantNotes: string,
): Promise<MembershipApplication[]> {
    return apiRequest(token, 'POST', `/api/membershipApplication/reject/${id}`, { internalNotes, applicantNotes });
}

export function reviewMembershipApplication(
    token: string,
    id: number,
    internalNotes: string,
    applicantNotes: string,
): Promise<MembershipApplication[]> {
    return apiRequest(token, 'POST', `/api/membershipApplication/review/${id}`, { internalNotes, applicantNotes });
}

export function getMembershipApplicationListExcel(token: string, year: number): Promise<Blob> {
    return apiRequestBlob(token, `/api/membershipApplication/list/excel?year=${year}`);
}
