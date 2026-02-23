import { ErrorResponse } from './errorResponse';

export type Event = {
    eventId: number,
    tenantId: string,
    start: string | Date,
    end: string | Date,
    eventType: string,
    eventTypeId: number,
    title: string,
    eventDescription: string,
    restrictSignups: boolean,
}

export type DeletedEvent = {
    eventId: number
}

export type PostNewEventRequest = {
    startDate?: string,
    endDate?: string,
    eventTypeId: number,
    eventName?: string,
    eventDescription?: string,
    restrictSignups?: boolean,
    tenantId: string,
}

export type PostNewEventResponse = Event | ErrorResponse

export type GetEventRequest = Record<string, never>

export type GetEventResponse = Event | ErrorResponse

export type PatchEventRequest = {
    startDate?: string,
    endDate?: string,
    eventName?: string,
    eventDescription?: string,
    restrictSignups: boolean,
}

export type PatchEventResponse = Event | ErrorResponse

export type DeleteEventRequest = Record<string, never>

export type DeleteEventResponse = DeletedEvent | ErrorResponse

export type GetEventListRequest = Record<string, never>

export type GetEventListResponse = Event[] | ErrorResponse
