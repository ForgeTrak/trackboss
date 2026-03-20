import { Request, Response, Router } from 'express';
import { getUniqueTags } from '../database/membershipTags';
import logger from '../logger';
import { validateAdminAccess } from '../util/auth';

const membershipTags = Router();

membershipTags.get('/unique', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const uniqueTags = await getUniqueTags(req.user.tenantId);
        res.json(uniqueTags);
    } catch (error: any) {
        logger.error(`membershipTags - Error at path ${req.path}`, error);
        res.status(500);
    }
});

export default membershipTags;
