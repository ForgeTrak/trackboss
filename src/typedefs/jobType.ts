import { ErrorResponse } from './errorResponse';

export type JobType = {
    jobTypeId: number,
    tenantId: string,
    title: string,
    pointValue: number,
    cashValue: number,
    jobDayNumber: number,
    reserved: boolean,
    online: boolean,
    mealTicket: boolean,
    sortOrder: number,
    active: boolean,
    jobDay: string,
    count?: number,
    lastModifiedDate: string,
    lastModifiedBy: string
}

export type PostNewJobTypeRequest = {
    title: string,
    pointValue?: number,
    cashValue?: number,
    jobDayNumber?: number,
    reserved: boolean,
    online: boolean,
    mealTicket: boolean,
    sortOrder?: number,
    modifiedBy: number
}

export type PostNewJobTypeResponse = JobType | ErrorResponse

export type GetJobTypeRequest = Record<string, never>

export type GetJobTypeResponse = JobType | ErrorResponse

export type PatchJobTypeRequest = {
    title?: string,
    pointValue?: number,
    cashValue?: number,
    jobDayNumber?: number,
    reserved?: boolean,
    online?: boolean,
    mealTicket?: boolean,
    sortOrder?: number,
    active?: boolean,
    modifiedBy: number
}

export type PatchJobTypeResponse = JobType | ErrorResponse

export type GetJobTypeListRequest = Record<string, never>

export type GetJobTypeListResponse = JobType[] | ErrorResponse
