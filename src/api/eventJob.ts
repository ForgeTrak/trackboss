import { Request, Response, Router } from 'express';
import { deleteEventJob, getEventJob, insertEventJob, patchEventJob } from '../database/eventJob';
import {
    DeleteEventJobResponse,
    GetEventJobResponse,
    PatchEventJobResponse,
    PostNewEventJobResponse,
} from '../typedefs/eventJob';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';

const eventJob = Router();

eventJob.post('/new', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostNewEventJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const token = await verify(headerCheck.token, 'Admin');
            const tenantId = token.active_tenant_id as string;
            const insertId = await insertEventJob(req.body, tenantId);
            response = await getEventJob(insertId, req.user.tenantId);
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

eventJob.get('/:eventJobID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetEventJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { eventJobID } = req.params;
            response = await getEventJob(Number(eventJobID), req.user.tenantId);
            res.status(200);
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

eventJob.patch('/:eventJobID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PatchEventJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { eventJobID } = req.params;
            const eventJobIdNum = Number(eventJobID);
            if (Number.isNaN(eventJobIdNum)) {
                throw new Error('not found');
            }
            await verify(headerCheck.token, 'Admin');
            await patchEventJob(eventJobIdNum, req.user.tenantId, req.body);
            response = await getEventJob(eventJobIdNum, req.user.tenantId);
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

eventJob.delete('/:eventJobID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: DeleteEventJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { eventJobID } = req.params;
            const eventJobIdNum = Number(eventJobID);
            if (Number.isNaN(eventJobIdNum)) {
                throw new Error('not found');
            }
            await verify(headerCheck.token, 'Admin');
            await deleteEventJob(eventJobIdNum, req.user.tenantId);
            response = { eventJobId: eventJobIdNum };
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

export default eventJob;
