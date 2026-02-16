import moment from 'moment';
import { apiRequest, getEventMonthDay, getTimeOfDay } from './utils';
import {
    DeleteEventResponse,
    GetEventListResponse,
    GetEventResponse,
    PatchEventRequest,
    PatchEventResponse,
    PostNewEventRequest,
    PostNewEventResponse,
    Event,
} from '../../../src/typedefs/event';
import { ErrorResponse } from '../../../src/typedefs/errorResponse';
// import { getCalendarJobs } from './job';
import { Job } from '../../../src/typedefs/job';

function isEventList(res: Event[] | ErrorResponse): res is Event[] {
    return (res as Event[]) !== undefined;
}

export function createEvent(token: string, eventData: PostNewEventRequest): Promise<PostNewEventResponse> {
    return apiRequest(token, 'POST', '/api/event/new', eventData);
}

// TODO: this is a mocked response for frontend development, replace once API is complete
export async function makeEvent(name: string, description: string, start: Date, end: Date, typeId: number) {
    // eslint-disable-next-line no-console
    console.debug({
        date: start,
        eventTypeId: typeId,
        eventName: name,
        eventDescription: description,
    });
}

export function getEventList(token: string, listType?: string): Promise<GetEventListResponse> {
    if (listType) {
        return apiRequest(token, 'GET', '/api/event/list', undefined, { range: listType });
    }
    return apiRequest(token, 'GET', '/api/event/list');
}

export async function getCalendarEvents(token: string) {
    const calendarEvents = await getEventList(token);
    if (isEventList(calendarEvents)) {
        calendarEvents.forEach((event) => {
            event.start = moment(event.start, 'YYYY-MM-DD HH:mm').toDate();
            event.end = moment(event.end, 'YYYY-MM-DD HH:mm').toDate();
        });
        return calendarEvents;
    }

    // else
    return undefined;
}

export async function getEventCardProps(token: string, listType: string) {
    const upcomingEvents = await getEventList(token, listType);

    if (isEventList(upcomingEvents)) {
        // + symbol here converts the dates to numbers, to allow for arithmetic comparison
        // upcomingEvents.sort((e1: Event, e2: Event) => +new Date(e1.start) - +new Date(e2.start));
        const startTime = upcomingEvents[0].start.toString();
        const formattedEventDate = getEventMonthDay(startTime);
        const formattedEventTime = getTimeOfDay(startTime);

        return {
            title: upcomingEvents[0].title,
            start: formattedEventDate,
            end: getEventMonthDay(upcomingEvents[0].end.toString()),
            time: formattedEventTime,
            fullDate: moment(upcomingEvents[0].start).format('MM-DD-YYYY'),
            id: upcomingEvents[0].eventId,
            eventType: upcomingEvents[0].eventType.toLowerCase(),
            description: upcomingEvents[0].eventDescription,
        };
    }

    // else
    return undefined;
}

export function getEvent(token: string, eventID: number): Promise<GetEventResponse> {
    return apiRequest(token, 'GET', `/api/event/${eventID}`);
}

export function updateEvent(
    token: string,
    eventID: number,
    eventData: PatchEventRequest,
): Promise<PatchEventResponse> {
    return apiRequest(token, 'PATCH', `/api/event/${eventID}`, eventData);
}

export function deleteEvent(token: string, eventID: number): Promise<DeleteEventResponse> {
    return apiRequest(token, 'DELETE', `/api/event/${eventID}`);
}

export async function getCalendarEventsAndJobs(token: string) {
    const events = await getCalendarEvents(token);
    // const jobs = await getCalendarJobs(token);

    let calendarEvents: Array<Job | Event> = [];
    if (events) { // && jobs) {
        calendarEvents = calendarEvents.concat(events);
        // calendarEvents = calendarEvents.concat(jobs);
    }

    return calendarEvents;
}

export function getNextEvent(token: string): Promise<GetEventResponse> {
    return apiRequest(token, 'GET', '/api/event/next');
}
