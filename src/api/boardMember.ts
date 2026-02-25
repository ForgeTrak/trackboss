import { Request, Response, Router } from 'express';
import {
    BoardMember,
    DeleteBoardMemberResponse,
    GetBoardMemberListResponse,
    GetBoardMemberResponse,
    PatchBoardMemberResponse,
    PostNewBoardMemberResponse,
} from '../typedefs/boardMember';
import {
    deleteBoardMember,
    getBoardMember,
    getBoardMemberList,
    insertBoardMember,
    patchBoardMember,
} from '../database/boardMember';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';

const boardMember = Router();

boardMember.post('/new', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostNewBoardMemberResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Admin');
            req.body.tenantId = req.user.tenantId;
            const insertId = await insertBoardMember(req.body);
            response = await getBoardMember(req.user.tenantId, insertId);
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

boardMember.get('/list', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetBoardMemberListResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const memberList: BoardMember[] =
                await getBoardMemberList(req.user.tenantId, req.query.year as string);
            res.status(200);
            response = memberList;
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

boardMember.get('/:boardMemberId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetBoardMemberResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { boardMemberId } = req.params;
            const id = Number(boardMemberId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            response = await getBoardMember(req.user.tenantId, id);
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

boardMember.patch('/:boardMemberId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PatchBoardMemberResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { boardMemberId } = req.params;
            const id = Number(boardMemberId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            await verify(headerCheck.token, 'Admin');
            req.body.tenantId = req.user.tenantId;
            await patchBoardMember(id, req.body);
            response = await getBoardMember(req.user.tenantId, id);
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

boardMember.delete('/:boardMemberId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: DeleteBoardMemberResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { boardMemberId } = req.params;
            const id = Number(boardMemberId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            await verify(headerCheck.token, 'Admin');
            await deleteBoardMember(req.user.tenantId, id);
            response = { boardMemberId: id };
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

export default boardMember;
