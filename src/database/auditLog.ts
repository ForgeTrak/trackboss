import { OkPacket, RowDataPacket } from 'mysql2';
import { diff } from 'jsondiffpatch';
import { getPool } from './pool';
import logger from '../logger';

export default async function logAuditEvent(
    req: any, entityType: string,
    entityId: any, before: any, after: any,
) {
    let action = '';
    switch (req.method) {
        case 'POST':
            action = 'create';
            break;
        case 'PUT':
        case 'PATCH':
            action = 'update';
            break;
        case 'DELETE':
            action = 'delete';
            break;
        default:
            action = '';
            break;
    }
    const requestInfo = {
        tenantId: req.user.tenantId,
        userId: req.user.uuid,
        userEmail: req.user.email,
        entityType,
        entityId,
        action,
        before,
        after,
    };
    const changeDetails = diff(before, after);

    const values = [req.user.tenantId, req.user.email, req.user.uuid,
        entityType, `${entityId}`, action, JSON.stringify(changeDetails)];
    await getPool().query<RowDataPacket[]>(
        `insert into audit_log 
        (tenant_id, user_email, user_id, entity_type, entity_id, user_action, change_details) 
        values (?, ?, ?, ?, ?, ?, ?)`,
        values,
    );
    logger.info(`Audit log: ${JSON.stringify(requestInfo)}`);
}

export async function getAuditLogById(tenantId: string, entityType: string, entityId: string) {
    const [rows] = await getPool().query<RowDataPacket[]>(
        'select * from audit_log where tenant_id = ? and entity_type = ? and entity_id = ? order by created_at desc',
        [tenantId, entityType, entityId],
    );
    return rows;
}

export async function getAuditLog(tenantId: string, entityTypes: string[]) {
    const [rows] = await getPool().query<RowDataPacket[]>(
        'select * from audit_log where tenant_id = ? and entity_type in ? order by created_at desc',
        [tenantId, `'${entityTypes.join('\',\'')}'`],
    );
    return rows;
}
