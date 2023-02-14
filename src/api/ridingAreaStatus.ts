import { Request, Response, Router } from 'express';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';
import {
    GetRidingAreaStatusResponse,
} from '../typedefs/ridingAreaStatus';
import { getRidingAreaStatuses, flipRidingAreaStatus } from '../database/ridingAreaStatus';

/**
 * All in one function to validate administrative access for a given user token. This will throw
 * an error if the token is not valid.  Callers can call this and then process the rest of the endpoint normally, as
 * this is a "catch all" function that does the work so you don't have to.
 *
 */
async function validateAdminAccess(req: Request, res: Response) {
    const { authorization } = req.headers;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        throw new Error(headerCheck.reason);
    } else {
        try {
            await verify(headerCheck.token, 'Admin');
        } catch (error: any) {
            logger.error('Error authorizing user token as admin', error);
            throw error;
        }
    }
}

const ridingAreaStatus = Router();

ridingAreaStatus.get('/', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetRidingAreaStatusResponse;
    const headerCheck = checkHeader(authorization);

    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            response = await getRidingAreaStatuses();
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
                logger.error('error getting track statuses', e);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

ridingAreaStatus.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ridingArea = req.body;
        await validateAdminAccess(req, res);
        const updatedArea = await flipRidingAreaStatus(Number(id), ridingArea);
        res.send(updatedArea);
    } catch (error: any) {
        logger.error(`Error at path ${req.path}`);
        logger.error(error);
        res.status(500);
        res.send('Unable to process application due to error');
    }
});

export default ridingAreaStatus;
