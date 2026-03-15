import { format } from 'date-fns';
import { Request, Response, Router } from 'express';

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
import logAuditEvent from '../database/auditLog';

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
            const newEvent = req.body as Event;
            const insertId = await insertEvent(req.user.tenantId, newEvent);
            response = await getEvent(insertId, req.user.tenantId);
            logAuditEvent(req, 'event', insertId, null, response);
            logger.info(`event - event created with ID ${insertId} for tenant ${req.user.tenantId}`);
            const relatedEvents = await getRelatedEvents(req.user.tenantId, response);
            // awaiting all this on purpose because a) it is fast and b) I want the UI to update when all of this
            // is done. We are in mañuel transmission mode here.
            // eslint-disable-next-line no-restricted-syntax
            for (const childEvent of relatedEvents) {
                // eslint-disable-next-line no-await-in-loop
                const childEventId = await insertEvent(req.user.tenantId, childEvent);
                // eslint-disable-next-line no-await-in-loop
                const newBornChildEvent = await getEvent(childEventId, req.user.tenantId);
                logger.info(`event - created child event ${newBornChildEvent.eventId} as a child of ${insertId}`);
                logAuditEvent(req, 'event', childEventId, null, newBornChildEvent);
            }
            res.status(201);
        } catch (e: any) {
            logger.error(`event - Error at path ${req.path}`, e);
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
            const token = await verify(headerCheck.token);
            const tenantId = token.active_tenant_id as string;
            const { range } = req.headers;
            let eventList: Event[];
            if (typeof range === 'undefined') {
                eventList = await getEventList(tenantId);
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
                            tenantId,
                            undefined,
                            `${format(endData.date, 'yyyy-MM-dd')}`,
                        );
                    } else if (end === '' && start !== '') {
                        eventList = await getEventList(tenantId, `${format(startData.date, 'yyyy-MM-dd')}`);
                    } else {
                        eventList = await getEventList(
                            tenantId,
                            `${format(startData.date, 'yyyy-MM-dd')}`,
                            `${format(endData.date, 'yyyy-MM-dd')}`,
                        );
                    }
                    res.status(206);
                }
            }
            response = eventList;
        } catch (e: any) {
            logger.error(`event - Error at path ${req.path}`, e);
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
            const token = await verify(headerCheck.token);
            const tenantId = token.active_tenant_id as string;
            const { eventID } = req.params;
            if (eventID === 'next') {
                response = await getClosestEvent(tenantId);
            } else {
                const id = Number(eventID);
                if (Number.isNaN(id)) {
                    throw new Error('not found');
                }
                response = await getEvent(id, tenantId);
            }
            res.status(200);
        } catch (e: any) {
            logger.error(`event - Error at path ${req.path}`, e);
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
            const before = await getEvent(id, req.user.tenantId);
            const token = await verify(headerCheck.token, 'Admin');
            const tenantId = token.active_tenant_id as string;
            await patchEvent(id, tenantId, req.body);
            response = await getEvent(id, tenantId);
            logAuditEvent(req, 'event', id, before, response);
            res.status(200);
        } catch (e: any) {
            logger.error(`event - Error at path ${req.path}`, e);
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
            const before = await getEvent(id, req.user.tenantId);
            const token = await verify(headerCheck.token, 'Admin');
            const tenantId = token.active_tenant_id as string;
            await deleteEvent(id, tenantId);
            logAuditEvent(req, 'event', id, before, null);
            response = { eventId: id };
            res.status(200);
        } catch (e: any) {
            logger.error(`event - Error at path ${req.path}`, e);
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

export default event;
