import { ErrorResponse } from './errorResponse';

export type EventType = {
    eventTypeId: number,
    tenantId: string,
    type: string,
    active: boolean,
    lastModifiedDate: string,
    lastModifiedBy: string,
    defaultStartTime: string,
    defaultEndTime: string,
}

export type PostNewEventTypeRequest = {
    type: string,
    modifiedBy: number
}

export type PostNewEventTypeResponse = EventType | ErrorResponse

export type GetEventTypeRequest = Record<string, never>

export type GetEventTypeResponse = EventType | ErrorResponse

export type PatchEventTypeRequest = {
    type?: string,
    active?: boolean,
    modifiedBy: number
}

export type PatchEventTypeResponse = EventType | ErrorResponse

export type GetEventTypeListRequest = Record<string, never>

export type GetEventTypeListResponse = EventType[] | ErrorResponse
