import { Request, Response, Router } from 'express';

import { checkHeader, validateAdminAccess } from '../util/auth';
import logger from '../logger';
import { getAuditLogById, getAuditLogByTenant } from '../database/auditLog';

const auditLog = Router();

auditLog.get('/:entityType/:entityId', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const { entityType, entityId } = req.params;
        const logs = await getAuditLogById(req.user.tenantId, entityType, entityId);
        res.send(logs);
    } catch (error: any) {
        logger.error(`auditLog - Error at path ${req.path}`, error);
        if (error.message === 'Authorization Failed') {
            res.status(401).send({ reason: 'not authorized' });
        } else {
            res.status(500).send({ reason: 'internal server error' });
        }
    }
});

auditLog.get('/', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const logs = await getAuditLogByTenant(req.user.tenantId);
        res.send(logs);
    } catch (error: any) {
        logger.error(`auditLog - Error at path ${req.path}`, error);
        if (error.message === 'Authorization Failed') {
            res.status(401).send({ reason: 'not authorized' });
        } else {
            res.status(500).send({ reason: 'internal server error' });
        }
    }
});

export default auditLog;
