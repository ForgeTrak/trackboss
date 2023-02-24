import { Request, Response, Router } from 'express';
import logger from '../logger';
import { checkHeader, verify } from '../util/auth';
import {
    GetMemberTypeListResponse,
    GetMemberTypeResponse,
    MemberType,
    PatchMemberTypeResponse,
} from '../typedefs/memberType';
import { getMemberType, getMemberTypeCounts, getMemberTypeList, patchMemberType } from '../database/memberType';

const memberType = Router();

memberType.get('/list', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMemberTypeListResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const memberTypeList: MemberType[] = await getMemberTypeList();
            res.status(200);
            response = memberTypeList;
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

memberType.get('/counts', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMemberTypeListResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const memberTypeList: MemberType[] = await getMemberTypeCounts();
            res.status(200);
            response = memberTypeList;
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

memberType.get('/:memberTypeID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMemberTypeResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { memberTypeID } = req.params;
            response = await getMemberType(Number(memberTypeID));
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

memberType.patch('/:memberTypeID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PatchMemberTypeResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { memberTypeID } = req.params;
            await verify(headerCheck.token, 'Admin');
            await patchMemberType(Number(memberTypeID), req.body);
            response = await getMemberType(Number(memberTypeID));
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

export default memberType;
