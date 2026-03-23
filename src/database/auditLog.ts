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
    logger.info(`${entityType} - ran action ${action} for id ${entityId}`);
    logger.info(`Audit log: ${JSON.stringify(requestInfo)}`);
}

export async function getAuditLogById(tenantId: string, entityType: string, entityId: string) {
    const [rows] = await getPool().query<RowDataPacket[]>(
        'select * from audit_log where tenant_id = ? and entity_type = ? and entity_id = ? order by created_at desc',
        [tenantId, entityType, entityId],
    );
    return rows;
}

export async function getAuditLogByTenant(tenantId: string) {
    // This gets the whole audit log, and we'll just allow filtering on the API and front end for now.
    // works because it's a small dataset.  If this becomes a problem we can add filtering here.
    const [rows] = await getPool().query<RowDataPacket[]>(`select al.*, m.last_name, m.first_name from
         audit_log al, member m 
         where al.user_id = m.uuid and al.tenant_id = ? order by al.created_at desc`, [tenantId]);
    return rows;
}
