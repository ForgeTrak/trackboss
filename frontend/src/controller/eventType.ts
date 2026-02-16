import { apiRequest } from './utils';
import {
    GetEventTypeListResponse,
    GetEventTypeResponse,
    PatchEventTypeRequest,
    PatchEventTypeResponse,
    PostNewEventTypeRequest,
    PostNewEventTypeResponse,
} from '../../../src/typedefs/eventType';

export function createEventType(
    token: string,
    eventTypeData: PostNewEventTypeRequest,
): Promise<PostNewEventTypeResponse> {
    return apiRequest(token, 'POST', '/api/eventType/new', eventTypeData);
}

export function getEventType(token: string, eventTypeId: number): Promise<GetEventTypeResponse> {
    return apiRequest(token, 'GET', `/api/eventType/${eventTypeId}`, undefined, { mode: 'no-cors' });
}

export function updateEventType(
    token: string,
    eventTypeId: number,
    eventTypeData: PatchEventTypeRequest,
): Promise<PatchEventTypeResponse> {
    return apiRequest(token, 'PATCH', `/api/eventType/${eventTypeId}`, eventTypeData, { mode: 'no-cors' });
}

export function getEventTypeList(token: string): Promise<GetEventTypeListResponse> {
    return apiRequest(token, 'GET', '/api/eventType/list');
}
