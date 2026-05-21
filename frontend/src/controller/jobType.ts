import { apiRequest } from './utils';
import {
    GetJobTypeListResponse,
    GetJobTypeResponse,
    PatchJobTypeRequest,
    PatchJobTypeResponse,
    PostNewJobTypeRequest,
    PostNewJobTypeResponse,
} from '../../../src/typedefs/jobType';

export function createJobType(
    token: string,
    jobTypeData: PostNewJobTypeRequest,
): Promise<PostNewJobTypeResponse> {
    return apiRequest(token, 'POST', '/api/jobType/new', jobTypeData);
}

export function getJobTypeList(token: string): Promise<GetJobTypeListResponse> {
    return apiRequest(token, 'GET', '/api/jobType/list', undefined, { mode: 'no-cors' });
}

export function getJobTypeListEventType(token: string, eventType: string): Promise<GetJobTypeListResponse> {
    return apiRequest(token, 'GET', `/api/jobType/list/${eventType}`);
}

export function getJobType(token: string, jobTypeID: number): Promise<GetJobTypeResponse> {
    return apiRequest(token, 'GET', `/api/jobType/${jobTypeID}`, undefined, { mode: 'no-cors' });
}

export function updateJobType(
    token: string,
    jobTypeID: number,
    jobTypeData: PatchJobTypeRequest,
): Promise<PatchJobTypeResponse> {
    return apiRequest(token, 'PATCH', `/api/jobType/${jobTypeID}`, jobTypeData);
}
