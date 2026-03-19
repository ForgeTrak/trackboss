import { ErrorResponse } from './errorResponse';
import { Job } from './job';

export type Bill = {
    billId: number,
    tenantId: string,
    generatedDate: string,
    year: number,
    amount: number,
    amountWithFee: number,
    pointsEarned: number,
    pointsThreshold: number,
    membershipAdmin: string,
    membershipAdminEmail: string,
    phone: string,
    membershipId: number,
    firstName: string,
    lastName: string,
    membershipType: string,
    emailedBill?: string, // undefined if not emailed, date otherwise
    curYearPaid: boolean,
    curYearIns: boolean,
    dueDate: string,
    paymentMethod?: string,
    squareLink?: string,
    squareOrderId?: string,
    detail?: string,
    contactedAndRenewing?: boolean,
    memberActive: boolean,
}

export type WorkPointThreshold = {
    year: number,
    threshold: number
}

export type GetWorkPointThresholdRequest = Record<string, never>

export type GetWorkPointThresholdResponse = WorkPointThreshold | ErrorResponse

export type GetBillListRequest = Record<string, never>

// Used only for the backend: API layer -> DB layer communication
export type GetBillListRequestFilters = {
    membershipId?: number,
    year?: number,
    paymentStatus?: string,
    membershipStatus?: string,
}

export type GetBillListResponse = Bill[] | ErrorResponse

export type PostCalculateBillsRequest = Record<string, never>

export type PostCalculateBillsResponse = Bill[] | ErrorResponse

// Used only for the backend: API layer -> DB layer communication
export type GenerateSingleBillRequest = {
    amount: number,
    amountWithFee: number,
    membershipId: number,
    pointsEarned: number,
    pointsThreshold: number,
    workDetail?: Job[],
    billingYear: number,
}

export type GetMembershipBillListRequest = Record<string, never>

export type GetMembershipBillListResponse = Bill[] | ErrorResponse

export type PostPayBillRequest = Record<string, never>

export type PostPayBillResponse = Record<string, never> | ErrorResponse
