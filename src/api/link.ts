import { Request, Response, Router } from 'express';
import {
    Link,
    GetLinkResponse,
    DeleteLinkResponse,
} from '../typedefs/link';
import {
    createLink,
    deleteLinkById,
    getAllLinks,
    getLinkById,
    getLinks,
    updateLink,
} from '../database/link';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';
import logAuditEvent from '../database/auditLog';

const link = Router();

link.get('/list', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetLinkResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const links: Link[] = await getLinks(req.user.tenantId);
            res.status(200);
            response = links;
        } catch (e: any) {
            logger.error(`link - Error at path ${req.path}`, e);
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

link.get('/all', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetLinkResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Admin');
            const links: Link[] = await getAllLinks(req.user.tenantId);
            res.status(200);
            response = links;
        } catch (e: any) {
            logger.error(`link - Error at path ${req.path}`, e);
            if (e.message === 'Authorization Failed') {
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

link.get('/:linkId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetLinkResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { linkId } = req.params;
            const id = Number(linkId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            await verify(headerCheck.token);
            response = await getLinkById(id, req.user.tenantId);
            res.status(200);
        } catch (e: any) {
            logger.error(`link - Error at path ${req.path}`, e);
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

link.delete('/:linkId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: DeleteLinkResponse = {
        linkId: 0,
    };
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { linkId } = req.params;
            const id = Number(linkId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            await verify(headerCheck.token, 'Admin');
            const before = await getLinkById(id, req.user.tenantId);
            await deleteLinkById(id, req.user.tenantId);
            response = { linkId: id };
            logAuditEvent(req, 'link', id, before, null);
            res.status(200);
        } catch (e: any) {
            logger.error(`link - Error at path ${req.path}`, e);
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

const isValidExternalUrl = (value?: string): boolean => {
    if (!value || typeof value !== 'string') {
        return false;
    }
    try {
        const parsed = new URL(value);
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
    } catch {
        return false;
    }
};

link.patch('/:linkId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetLinkResponse = {} as any;

    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { linkId } = req.params;
            const id = Number(linkId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            if (!isValidExternalUrl(req.body?.linkUrl)) {
                throw new Error('user input error');
            }
            await verify(headerCheck.token, 'Admin');
            const before = await getLinkById(id, req.user.tenantId);
            await updateLink(id, req.body, req.user.tenantId);
            const after = await getLinkById(id, req.user.tenantId);
            logAuditEvent(req, 'link', id, before, after);
            response = after;
            res.status(200);
        } catch (e: any) {
            logger.error(`link - Error at path ${req.path}`, e);
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

link.post('/', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetLinkResponse = {} as any;

    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            if (!isValidExternalUrl(req.body?.linkUrl)) {
                throw new Error('user input error');
            }
            await verify(headerCheck.token, 'Admin');
            const created = await createLink(req.body, req.user.tenantId);
            response = created;
            logAuditEvent(req, 'link', created.linkId ?? null, null, response);
            res.status(200);
        } catch (e: any) {
            logger.error(`link - Error at path ${req.path}`, e);
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

export default link;
