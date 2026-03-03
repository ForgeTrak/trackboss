import { ErrorResponse } from './errorResponse';

export type Membership = {
    membershipId: number,
    tenantId: string,
    membershipAdmin: string,
    status: string,
    curYearRenewed: boolean,
    renewalSent: boolean,
    yearJoined: number,
    address: string,
    city: string,
    state: string,
    zip: string,
    membershipType: string,
    lastModifiedDate: string,
    lastModifiedBy: string
}

export type Registration = {
    memberType: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    occupation: string,
    email: string,
    birthdate: string,
    address: string,
    city: string,
    state: string,
    zip: string
}

export type PostNewMembershipRequest = {
    membershipTypeId: number,
    membershipAdminId?: number,
    yearJoined?: number,
    address?: string,
    city?: string,
    state?: string,
    zip?: string,
    modifiedBy: number
}

export type PostNewMembershipResponse = Membership | ErrorResponse

export type GetMembershipRequest = Record<string, never>

export type GetMembershipResponse = Membership | ErrorResponse

export type PatchMembershipRequest = {
    membershipAdminId?: number,
    membershipTypeId?: number,
    status?: string,
    curYearRenewed?: boolean,
    renewalSent?: boolean,
    yearJoined?: number,
    address?: string,
    city?: string,
    state?: string,
    zip?: string,
    modifiedBy: number
}

export type PatchMembershipResponse = Membership | ErrorResponse

export type GetMembershipListRequest = Record<string, never>

export type GetMembershipListResponse = Membership[] | ErrorResponse

export type PostRegisterMembershipRequest = {
    memberTypeId: number,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    occupation?: string,
    email?: string,
    birthdate?: string,
    address?: string,
    city?: string,
    state?: string,
    zip?: string
}

export type PostRegisterMembershipResponse = Registration | ErrorResponse
