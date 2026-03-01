import { Request, Response, Router } from 'express';
import { deleteBike, getBike, getBikeList, insertBike, patchBike } from '../database/bike';
import {
    Bike,
    DeleteBikeResponse,
    GetBikeListResponse,
    GetBikeResponse,
    PatchBikeResponse,
    PostNewBikeResponse,
} from '../typedefs/bike';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';

const bike = Router();

bike.post('/new', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostNewBikeResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const token = await verify(headerCheck.token, 'Membership Admin');
            const tenantId = token.active_tenant_id as string;
            const bikeRequest = req.body;
            bikeRequest.tenantId = tenantId;
            const insertId = await insertBike(req.body);
            response = await getBike(insertId, tenantId);
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

bike.get('/list', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetBikeListResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const id = req.query.membershipID;
            const filterMembership = Number(id);
            const bikeList: Bike[] = await getBikeList(filterMembership, req.user.tenantId);
            res.status(200);
            response = bikeList;
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

bike.get('/:bikeID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetBikeResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const token = await verify(headerCheck.token);
            const tenantId = token.active_tenant_id as string;
            const { bikeID } = req.params;
            response = await getBike(Number(bikeID), tenantId);
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

bike.patch('/:bikeID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PatchBikeResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { bikeID } = req.params;
            const bikeIdNum = Number(bikeID);
            if (Number.isNaN(bikeIdNum)) {
                throw new Error('not found');
            }
            const token = await verify(headerCheck.token, 'Membership Admin');
            const tenantId = token.active_tenant_id as string;
            const bikeRequest = req.body;
            bikeRequest.tenantId = tenantId;
            await patchBike(bikeIdNum, bikeRequest);
            response = await getBike(bikeIdNum, tenantId);
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

bike.delete('/:bikeID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: DeleteBikeResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { bikeID } = req.params;
            const bikeIdNum = Number(bikeID);
            if (Number.isNaN(bikeIdNum)) {
                throw new Error('not found');
            }
            const token = await verify(headerCheck.token, 'Membership Admin');
            const tenantId = token.active_tenant_id as string;
            await deleteBike(bikeIdNum, tenantId);
            response = { bikeId: bikeIdNum };
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

export default bike;
