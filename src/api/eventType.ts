import { Request, Response, Router } from 'express';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';

import {
    GetEventTypeListResponse,
    GetEventTypeResponse,
    EventType,
    PatchEventTypeResponse,
    PostNewEventTypeResponse,
} from '../typedefs/eventType';
import { insertEventType, getEventType, getEventTypeList, patchEventType } from '../database/eventType';
import logAuditEvent from '../database/auditLog';

const eventType = Router();

eventType.post('/new', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostNewEventTypeResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Admin');
            const insertId = await insertEventType(req.user.tenantId, req.body);
            response = await getEventType(insertId, req.user.tenantId);
            logAuditEvent(req, 'eventType', insertId, null, req.body);
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

eventType.get('/list', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetEventTypeListResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const eventTypeList: EventType[] = await getEventTypeList(req.user.tenantId);
            res.status(200);
            response = eventTypeList;
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'Authorization Failed') {
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

eventType.get('/:eventTypeID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetEventTypeResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { eventTypeID } = req.params;
            response = await getEventType(Number(eventTypeID), req.user.tenantId);
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

eventType.patch('/:eventTypeID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PatchEventTypeResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { eventTypeID } = req.params;
            await verify(headerCheck.token, 'Admin');
            const before = await getEventType(Number(eventTypeID), req.user.tenantId);
            await patchEventType(Number(eventTypeID), req.user.tenantId, req.body);
            response = await getEventType(Number(eventTypeID), req.user.tenantId);
            logAuditEvent(req, 'eventType', Number(eventTypeID), before, response);
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

export default eventType;
