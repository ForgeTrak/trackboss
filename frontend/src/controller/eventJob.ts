import { apiRequest } from './utils';
import {
    DeleteEventJobResponse,
    GetEventJobResponse,
    PatchEventJobRequest,
    PatchEventJobResponse,
    PostNewEventJobRequest,
    PostNewEventJobResponse,
} from '../../../src/typedefs/eventJob';

export function createEventJob(
    token: string,
    eventJobData: PostNewEventJobRequest,
): Promise<PostNewEventJobResponse> {
    return apiRequest(token, 'POST', '/api/eventJob/new', eventJobData);
}

export function getEventJob(token: string, eventJobId: number): Promise<GetEventJobResponse> {
    return apiRequest(token, 'GET', `/api/eventJob/${eventJobId}`);
}

export function updateEventJob(
    token: string,
    eventJobId: number,
    eventJobData: PatchEventJobRequest,
): Promise<PatchEventJobResponse> {
    return apiRequest(token, 'PATCH', `/api/eventJob/${eventJobId}`, eventJobData);
}

export function deleteEventJob(token: string, eventJobId: number): Promise<DeleteEventJobResponse> {
    return apiRequest(token, 'DELETE', `/api/eventJob/${eventJobId}`);
}
