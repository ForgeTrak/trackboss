import { BoardMember } from './boardMember';
import { ErrorResponse } from './errorResponse';

export type Member = {
    tenantId: string,
    memberId: number,
    membershipId: number,
    membershipAdmin: string,
    membershipAdminId: number,
    uuid: string,
    active: boolean,
    memberTypeId: number,
    memberType: string,
    membershipType: string,
    membershipTypeId: number,
    firstName: string,
    lastName: string,
    phoneNumber?: string,
    occupation: string,
    email: string,
    birthdate: string,
    dateJoined: string,
    address: string,
    city: string,
    state: string,
    zip: string,
    lastModifiedDate: string,
    lastModifiedBy: string,
    isBoardMember: boolean,
    boardMemberData? : BoardMember // optional field to be used only by the frontend to store data
    deactivationReason?: string,
    subscribed?: boolean,
    dependentStatus?: string,
    isEligibleDependent?: boolean,
}

export type PostNewMemberRequest = {
    membershipId?: number,
    uuid?: string,
    memberTypeId: number,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    occupation?: string,
    email?: string,
    birthdate?: string,
    dateJoined?: string,
    membershipType?: string,
    modifiedBy: number,
    subscribed: boolean,
    dependentStatus?: string,
    isEligibleDependent?: boolean,
}

export type PostNewMemberResponse = Member | ErrorResponse;

export type GetMemberRequest = Record<string, never>;

export type GetMemberResponse = Member | ErrorResponse;

export type PatchMemberRequest = {
    membershipId?: number,
    uuid?: string,
    active?: boolean,
    memberTypeId?: number,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    occupation?: string,
    email?: string,
    birthdate?: string,
    dateJoined?: string,
    modifiedBy: number,
    deactivationReason?: string,
    subscribed?: boolean,
    dependentStatus?: string,
    isEligibleDependent?: boolean,
}

export type PatchMemberResponse = Member | ErrorResponse;

export type GetMemberListRequest = Record<string, never>

export type GetMemberListResponse = Member[] | ErrorResponse;

export type GetMemberListFilters = {
    type?: string,
    membershipId?: number
}
