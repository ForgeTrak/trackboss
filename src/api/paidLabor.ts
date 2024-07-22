import { Request, Response, Router } from 'express';
import {
    PaidLabor, GetPaidLaborResponse,
    DeletePaidLaborResponse,
} from '../typedefs/paidLabor';
import {
    createPaidLabor,
    deletePaidLaborById,
    getPaidLabor,
    getPaidLaborById,
    updatePaidLabor,
} from '../database/paidLabor';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';

const paidLabor = Router();

paidLabor.get('/list', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetPaidLaborResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const links: PaidLabor[] = await getPaidLabor();
            res.status(200);
            response = links;
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

paidLabor.get('/:paidLaborId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetPaidLaborResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { memberTypeID } = req.params;
            response = await getPaidLaborById(Number(memberTypeID));
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

paidLabor.delete('/:paidLaborId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: DeletePaidLaborResponse = {
        paidLaborId: 0,
    };
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
    } else {
        try {
            const { paidLaborId } = req.params;
            const id = Number(paidLaborId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            await verify(headerCheck.token, 'Admin');
            await deletePaidLaborById(id);
            response = { paidLaborId: id };
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

paidLabor.patch('/:paidLaborId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetPaidLaborResponse = {};

    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
    } else {
        try {
            const { paidLaborId } = req.params;
            const id = Number(paidLaborId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            await verify(headerCheck.token, 'Admin');
            await updatePaidLabor(id, req.body);
            response = req.body;
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

paidLabor.post('/', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetPaidLaborResponse = {};

    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
    } else {
        try {
            await verify(headerCheck.token, 'Admin');
            response = await createPaidLabor(req.body);
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

export default paidLabor;
