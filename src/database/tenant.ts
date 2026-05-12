import { OkPacket, RowDataPacket } from 'mysql2';
import { Tenant } from '../typedefs/tenant';

import logger from '../logger';
import { getPool } from './pool';

export async function getTenants(): Promise<Tenant[]> {
    const sql = 'select * from tenants';
    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql);
    } catch (e) {
        logger.error(`DB error getting tenants list: ${e}`);
        throw new Error('internal server error');
    }
    return results.map((result) => ({
        tenantId: result.tenant_id,
        name: result.name,
        slug: result.slug,
        contactName: result.tenant_contact_name,
        contactEmail: result.tenant_email,
        contactPhone: result.tenant_phone,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
    }));
}

export async function getTenantById(tenantId: string): Promise<Tenant> {
    const sql = 'select * from tenants where tenant_id = ?';
    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, [tenantId]);
    } catch (e) {
        logger.error(`DB error getting tenant with ID ${tenantId}: ${e}`);
        throw new Error('internal server error');
    }
    if (results.length === 0) {
        throw new Error('tenant not found');
    }
    const result = results[0];
    return {
        tenantId: result.tenant_id,
        name: result.name,
        slug: result.slug,
        contactName: result.tenant_contact_name,
        contactEmail: result.tenant_email,
        contactPhone: result.tenant_phone,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
    };
}

export async function getTenantBySlug(slug: string): Promise<Tenant> {
    const sql = 'select * from tenants where slug = ?';
    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, [slug]);
    } catch (e) {
        logger.error(`DB error getting tenant with ID ${slug}: ${e}`);
        throw new Error('internal server error');
    }
    if (results.length === 0) {
        throw new Error('tenant not found');
    }
    const result = results[0];
    return {
        tenantId: result.tenant_id,
        name: result.name,
        slug: result.slug,
        contactName: result.tenant_contact_name,
        contactEmail: result.tenant_email,
        contactPhone: result.tenant_phone,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
    };
}
