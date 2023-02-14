import { Request, Response, Router } from 'express';
import {
    getMembership,
    getMembershipList,
    getRegistration,
    insertMembership,
    patchMembership,
    registerMembership,
} from '../database/membership';
import {
    GetMembershipListResponse,
    GetMembershipResponse,
    Membership,
    PatchMembershipResponse,
    PostNewMembershipResponse,
    PostRegisterMembershipResponse,
} from '../typedefs/membership';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';

const membership = Router();

membership.post('/new', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostNewMembershipResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Admin');
            const insertId = await insertMembership(req.body);
            response = await getMembership(insertId);
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

membership.get('/list', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMembershipListResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { status } = req.query;
            const membershipList: Membership[] = await getMembershipList(status as string);
            res.status(200);
            response = membershipList;
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

// This request does not require authentication.
membership.post('/register', async (req: Request, res: Response) => {
    let response: PostRegisterMembershipResponse;
    try {
        const insertId = await registerMembership(req.body);
        response = await getRegistration(insertId);
        res.status(201);
    } catch (e: any) {
        logger.error(`Error at path ${req.path}`);
        logger.error(e);
        if (e.message === 'user input error') {
            res.status(400);
            response = { reason: 'bad request' };
        } else {
            res.status(500);
            response = { reason: 'internal server error' };
        }
    }
    res.send(response);
});

membership.get('/:membershipID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMembershipResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { membershipID } = req.params;
            response = await getMembership(Number(membershipID));
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

membership.patch('/:membershipID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PatchMembershipResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { membershipID } = req.params;
            const membershipIdNum = Number(membershipID);
            if (Number.isNaN(membershipIdNum)) {
                throw new Error('not found');
            }
            await verify(headerCheck.token, 'Membership Admin');
            await patchMembership(membershipIdNum, req.body);
            response = await getMembership(membershipIdNum);
            res.status(200);
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

export default membership;
