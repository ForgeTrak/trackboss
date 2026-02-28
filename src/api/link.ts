import { Request, Response, Router } from 'express';
import {
    Link, GetLinkResponse,
} from '../typedefs/link';
import {
    getLinks,
} from '../database/link';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';

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

export default link;
