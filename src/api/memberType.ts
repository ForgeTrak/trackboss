import { Request, Response, Router } from 'express';
import logger from '../logger';
import { checkHeader, verify } from '../util/auth';
import {
    GetMemberTypeListResponse,
    GetMemberTypeResponse,
    MemberType,
    PatchMemberTypeResponse,
} from '../typedefs/memberType';
import { getMemberType, getMembershipTypeCounts, getMemberTypeList, patchMemberType } from '../database/memberType';
import logAuditEvent from '../database/auditLog';

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
            const memberTypeList: MemberType[] = await getMemberTypeList(req.user.tenantId);
            res.status(200);
            response = memberTypeList;
        } catch (e: any) {
            logger.error(`memberType - Error at path ${req.path}`, e);
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

memberType.get('/membershipCounts', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMemberTypeListResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const memberTypeList: MemberType[] = await getMembershipTypeCounts(req.user.tenantId);
            res.status(200);
            response = memberTypeList;
        } catch (e: any) {
            logger.error(`memberType - Error at path ${req.path}`, e);
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
            response = await getMemberType(Number(memberTypeID), req.user.tenantId);
            res.status(200);
        } catch (e: any) {
            logger.error(`memberType - Error at path ${req.path}`, e);
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
            const before = await getMemberType(Number(memberTypeID), req.user.tenantId);
            await patchMemberType(Number(memberTypeID), req.user.tenantId, req.body);
            response = await getMemberType(Number(memberTypeID), req.user.tenantId);
            logAuditEvent(req, 'memberType', Number(memberTypeID), before, response);
            res.status(200);
        } catch (e: any) {
            logger.error(`memberType - Error at path ${req.path}`, e);
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
