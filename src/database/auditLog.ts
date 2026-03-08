import logger from '../logger';

export default async function logAuditEvent(
    req: any, entityType: string,
    entityId: string, action: string, before: any, after: any,
) {
    const requestInfo = {
        tenantId: req.user.tenantId,
        userEmail: req.user.email,
        entityType,
        entityId,
        action,
        before,
        after,
    };
    logger.info(`Audit log: ${JSON.stringify(requestInfo)}`);
}
