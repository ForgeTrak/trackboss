import { Request, Response, Router } from 'express';
import { getTenantBySlug } from '../database/tenant';
import logger from '../logger';

const tenant = Router();

tenant.get('/slug/:slug', async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const result = await getTenantBySlug(slug);
        res.status(200).send(result);
    } catch (e: any) {
        logger.error(`tenant - Error at path ${req.path}`, e);
        if (e.message === 'tenant not found') {
            res.status(404).send({ reason: 'not found' });
        } else {
            res.status(500).send({ reason: 'internal server error' });
        }
    }
});

export default tenant;
