import { ErrorResponse } from './errorResponse';

export type Job = {
    jobId: number,
    member?: string,
    eventId: number,
    event: string,
    start: string | Date,
    end: string | Date,
    title: string,
    verified: boolean,
    verifiedDate?: string,
    pointsAwarded: number,
    paid: boolean,
    paidDate?: string,
    lastModifiedDate: string,
    lastModifiedBy: string
}

export type DeletedJob = {
    jobId: number
}

export type PostNewJobRequest = {
    memberId?: number,
    eventId?: number,
    jobTypeId: number,
    jobStartDate?: string,
    jobEndDate?: string,
    pointsAwarded?: number,
    verified?: boolean,
    verifiedDate? : string,
    paid?: boolean,
    paidDate?: string,
    modifiedBy: number
}

export type PostNewJobResponse = Job | ErrorResponse

export type GetJobRequest = Record<string, never>

export type GetJobResponse = Job | ErrorResponse

export type PatchJobRequest = {
    memberId?: number,
    eventId?: number,
    jobTypeId?: number,
    jobStartDate?: string,
    jobEndDate?: string,
    pointsAwarded?: number,
    verified?: boolean,
    paid?: boolean,
    modifiedBy: number
}

export type PatchJobResponse = Job | ErrorResponse

export type PostCloneJobRequest = Record<string, never>

export type PostCloneJobResponse = Job | ErrorResponse

export type DeleteJobRequest = Record<string, never>

export type DeleteJobResponse = DeletedJob | ErrorResponse

export type GetJobListRequest = Record<string, never>

export type GetJobListResponse = Job[] | ErrorResponse

export type GetJobListRequestFilters = {
    assignmentStatus?:boolean,
    verificationStatus?:boolean,
    memberId?:number,
    membershipId?: number,
    eventId?: number,
    startDate?:string,
    endDate?:string,
}
