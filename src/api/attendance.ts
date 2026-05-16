import { Request, Response, Router } from 'express';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';
import {
    GetAttendanceResponse,
    GetAttendanceLeaderboardResponse,
    PostCheckInResponse,
} from '../typedefs/attendance';
import { checkInMember, getAttendanceByMember, getAttendanceLeaderboard } from '../database/attendance';

const attendance = Router();

// POST / - Check in the current user
attendance.post('/', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostCheckInResponse;
    const headerCheck = checkHeader(authorization);

    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { memberId, membershipId } = req.body;
            response = await checkInMember(memberId, membershipId, req.user.tenantId);
            res.status(201);
        } catch (e: any) {
            logger.error(`attendance - Error at path ${req.path}`, e);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'already checked in today') {
                res.status(409);
                response = { reason: 'already checked in today' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

// GET /member/:memberId - Get attendance records for a specific member
attendance.get('/member/:memberId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetAttendanceResponse;
    const headerCheck = checkHeader(authorization);

    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { memberId } = req.params;
            const year = req.query.year ? Number(req.query.year) : undefined;
            response = await getAttendanceByMember(Number(memberId), req.user.tenantId, year);
            res.status(200);
        } catch (e: any) {
            logger.error(`attendance - Error at path ${req.path}`, e);
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

// GET /leaderboard - Get attendance leaderboard
attendance.get('/leaderboard', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetAttendanceLeaderboardResponse;
    const headerCheck = checkHeader(authorization);

    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const year = req.query.year ? Number(req.query.year) : undefined;
            response = await getAttendanceLeaderboard(req.user.tenantId, year);
            res.status(200);
        } catch (e: any) {
            logger.error(`attendance - Error at path ${req.path}`, e);
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

export default attendance;
