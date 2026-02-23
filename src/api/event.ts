import { format } from 'date-fns';
import { Request, Response, Router } from 'express';
import ical from 'ical-generator';

import {
    deleteEvent, getClosestEvent, getEvent, getEventList, getRelatedEvents,
    insertEvent, patchEvent,
} from '../database/event';
import {
    DeleteEventResponse,
    Event,
    GetEventListResponse,
    GetEventResponse,
    PatchEventResponse,
    PostNewEventResponse,
} from '../typedefs/event';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';

const event = Router();

event.post('/new', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostNewEventResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const token = await verify(headerCheck.token, 'Admin');
            const newEvent = req.body as Event;
            newEvent.tenantId = token.active_tenant_id as string;
            const insertId = await insertEvent(newEvent);
            response = await getEvent(insertId);
            const relatedEvents = await getRelatedEvents(response);
            // awaiting all this on purpose because a) it is fast and b) I want the UI to update when all of this
            // is done. We are in mañuel transmission mode here.
            // eslint-disable-next-line no-restricted-syntax
            for (const childEvent of relatedEvents) {
                // eslint-disable-next-line no-await-in-loop
                await insertEvent(childEvent);
            }
            res.status(201);
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'user input error') {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

event.get('/list', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetEventListResponse;
    const headerCheck = checkHeader(authorization);
    const verifyDate = (dateString: string) => {
        let valid = true;
        if (dateString === '') {
            valid = true;
        }
        const year = Number(dateString.slice(0, 4));
        const month = Number(dateString.slice(4, 6));
        const day = Number(dateString.slice(6, 8));
        if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
            valid = false;
        }
        return { valid, date: new Date(year, month - 1, day) };
    };
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { range } = req.headers;
            let eventList: Event[];
            if (typeof range === 'undefined') {
                eventList = await getEventList();
                res.status(200);
            } else {
                const [start, end] = range.split('-');
                if (start === undefined || end === undefined) {
                    throw new Error('user input error');
                }
                const startData = verifyDate(start);
                const endData = verifyDate(end);
                if (!startData.valid || !endData.valid) {
                    throw new Error('user input error');
                } else {
                    if (start === '' && end !== '') {
                        eventList = await getEventList(
                            undefined,
                            `${format(endData.date, 'yyyy-MM-dd')}`,
                        );
                    } else if (end === '' && start !== '') {
                        eventList = await getEventList(`${format(startData.date, 'yyyy-MM-dd')}`);
                    } else {
                        eventList = await getEventList(
                            `${format(startData.date, 'yyyy-MM-dd')}`,
                            `${format(endData.date, 'yyyy-MM-dd')}`,
                        );
                    }
                    res.status(206);
                }
            }
            response = eventList;
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'user input error') {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

event.get('/:eventID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetEventResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { eventID } = req.params;
            if (eventID === 'next') {
                response = await getClosestEvent();
            } else {
                const id = Number(eventID);
                if (Number.isNaN(id)) {
                    throw new Error('not found');
                }
                response = await getEvent(id);
            }
            res.status(200);
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

event.patch('/:eventID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PatchEventResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { eventID } = req.params;
            const id = Number(eventID);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            const token = await verify(headerCheck.token, 'Admin');
            const tenantId = token.active_tenant_id as string;
            await patchEvent(id, tenantId, req.body);
            response = await getEvent(id);
            res.status(200);
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'user input error') {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

event.delete('/:eventID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: DeleteEventResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { eventID } = req.params;
            const id = Number(eventID);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            const token = await verify(headerCheck.token, 'Admin');
            const tenantId = token.active_tenant_id as string;
            await deleteEvent(id, tenantId);
            response = { eventId: id };
            res.status(200);
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

event.get('/calendar/ical', async (req: Request, res: Response) => {
    const eventList : Event[] = await getEventList();
    const cal = ical({
        name: 'Palmyra Racing Association - Calendar',
    });

    eventList.forEach((trackbossEvent) => {
        cal.createEvent({
            start: trackbossEvent.start,
            end: trackbossEvent.end,
            summary: trackbossEvent.title,
            description: trackbossEvent.eventDescription,
            location: '4343 Hogback Hill Road Palmyra NY 14522',
            url: 'https://trackboss.hogbackmx.com',
        });
    });
    res.setHeader('Content-Type', 'text/calendar');
    res.send(cal.toString());
});

export default event;
