import { apiRequest, apiRequestBlob } from './utils';
import {
    DeleteJobResponse,
    GetJobListResponse,
    GetJobResponse,
    Job,
    PatchJobRequest,
    PatchJobResponse,
    PostCloneJobResponse,
    PostNewJobRequest,
    PostNewJobResponse,
} from '../../../src/typedefs/job';

export function createJob(token: string, jobData: PostNewJobRequest): Promise<PostNewJobResponse> {
    return apiRequest(token, 'POST', '/api/job/new', jobData);
}

export function getJobList(token: string, queryType?: string, filterType?: string): Promise<GetJobListResponse> {
    const path = (queryType && filterType)
        ? `/api/job/list?${queryType}=${filterType}`
        : '/api/job/list';
    return apiRequest(token, 'GET', path);
}

export async function getCalendarJobs(token: string) {
    const calendarJobs = await getJobList(token);
    if (Array.isArray(calendarJobs)) {
        calendarJobs.forEach((job) => {
            job.start = new Date(job.start);
            if (job.end) {
                job.end = new Date(job.end);
            }
        });
        return calendarJobs;
    }

    // else
    return undefined;
}

export function getJob(token: string, jobID: number): Promise<GetJobResponse> {
    return apiRequest(token, 'GET', `/api/job/${jobID}`);
}

export function updateJob(token: string, jobID: number, jobData: PatchJobRequest): Promise<PatchJobResponse> {
    return apiRequest(token, 'PATCH', `/api/job/${jobID}`, jobData);
}

export function cloneJob(token: string, jobID: number): Promise<PostCloneJobResponse> {
    return apiRequest(token, 'POST', `/api/job/${jobID}`);
}

export function deleteJob(token: string, jobID: number): Promise<DeleteJobResponse> {
    return apiRequest(token, 'DELETE', `/api/job/${jobID}`);
}

export function setVerifiedState(token: string, jobId: number, state: boolean): Promise<any> {
    return apiRequest(token, 'PATCH', `/api/job/verify/${jobId}/${state}`);
}

export async function setPaidState(token: string, jobId: number): Promise<any> {
    const paidJob: any = await getJob(token, jobId);
    const isPaidLaborer = (!paidJob.memberId && paidJob.member);
    if (isPaidLaborer) {
        paidJob.paidLabor = paidJob.member;
    }
    paidJob.paid = !paidJob.paid;
    const modifiedJob: any = await updateJob(token, jobId, paidJob);
    return modifiedJob;
}

/**
 * Signup a user for a job.
 * @param token user token
 * @param jobId job to sign up for.
 * @param workerId member, or paid laborer, to signup for the job.
 * @returns job signed up for.
 */
export async function signupForJob(token: string, jobId: number, workerId: number, isPaidLabor: boolean = false)
    : Promise<any> {
    const signupJob: any = await getJob(token, jobId);
    if (isPaidLabor) {
        signupJob.paidLaborId = workerId;
    } else {
        signupJob.memberId = workerId;
    }
    const modifiedJob: any = await updateJob(token, jobId, signupJob);
    return modifiedJob;
}

export async function signupForJobFreeForm(token: string, jobId: number, name: string): Promise<any> {
    const signupJob: any = await getJob(token, jobId);
    // when we add paid labor to a job the assumption is that it is paid. Admins can undo this, but this
    // assumption saves them work.
    signupJob.paidLabor = name;
    signupJob.paid = true;
    const modifiedJob: any = await updateJob(token, jobId, signupJob);
    return modifiedJob;
}

export function signupForOpenEventJob(token: string, eventId: number, memberId: number): Promise<any> {
    return apiRequest(token, 'PATCH', `/api/job/event/${eventId}/${memberId}`);
}

export function removeSignup(token: string, jobId: number): Promise<any> {
    return apiRequest(token, 'PATCH', `/api/job/remove/signup/${jobId}`);
}

export async function modifyJobPoints(token: string, jobId: number, points: number): Promise<any> {
    const signupJob: GetJobResponse = await getJob(token, jobId) as Job;
    signupJob.pointsAwarded = points;
    const updatedJob = await updateJob(token, jobId, signupJob);
    return updatedJob;
}

interface Worker {
    name: string,
    job: string,
    verified: boolean
}

export function getSignupList(token: string, eventId: number): Promise<Worker[]> {
    return apiRequest(token, 'GET', `/api/job/list?eventID=${eventId}`);
}

export function getSignupListExcel(token: string, eventId: number, shouldGetJobs: boolean): Promise<Blob> {
    const path = shouldGetJobs
        ? `/api/job/list/excel?eventID=${eventId}`
        : '/api/workPoints/list/excel';
    return apiRequestBlob(token, path);
}
