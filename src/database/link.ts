import { OkPacket, RowDataPacket } from 'mysql2';

import logger from '../logger';
import { getPool } from './pool';
import { Link } from '../typedefs/link';

function mapRowToLink(result: RowDataPacket): Link {
    return {
        linkId: result.link_id,
        tenantId: result.tenant_id,
        linkTitle: result.link_title,
        linkUrl: result.link_url,
        linkDisplayOrder: result.display_order,
        online: Boolean(result.online),
    };
}

export async function getLinks(tenantId: string): Promise<Link[]> {
    const sql = 'select * from link where online = 1 and tenant_id = ? order by display_order';
    const values: string[] = [tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting link list: ${e}`);
        throw new Error('internal server error');
    }
    return results.map(mapRowToLink);
}

export async function getAllLinks(tenantId: string): Promise<Link[]> {
    const sql = 'select * from link where tenant_id = ? order by online desc, display_order';
    const values: string[] = [tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting all links list: ${e}`);
        throw new Error('internal server error');
    }
    return results.map(mapRowToLink);
}

export async function getLinkById(id: number, tenantId: string): Promise<Link> {
    const sql = 'select * from link where link_id = ? and tenant_id = ?';
    const values: any[] = [id, tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting link by id: ${e}`);
        throw new Error('internal server error');
    }
    if (!results || results.length < 1) {
        throw new Error('not found');
    }
    return mapRowToLink(results[0]);
}

export async function deleteLinkById(id: number, tenantId: string): Promise<{ linkId: number }> {
    const values = [id, tenantId];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(
            'delete from link where link_id = ? and tenant_id = ?',
            values,
        );
    } catch (e) {
        logger.error(`DB error deleting link: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
    return { linkId: id };
}

export async function createLink(link: Link, tenantId: string): Promise<Link> {
    const onlineValue = link.online === undefined ? 1 : Number(link.online);

    let result;
    try {
        let displayOrder = link.linkDisplayOrder;
        if (displayOrder === undefined || displayOrder === null) {
            const [orderRows] = await getPool().query<RowDataPacket[]>(
                'select coalesce(max(display_order), 0) + 1 as next_order from link where tenant_id = ?',
                [tenantId],
            );
            displayOrder = orderRows[0]?.next_order ?? 1;
        }
        const values = [
            tenantId,
            link.linkTitle,
            link.linkUrl,
            displayOrder,
            onlineValue,
        ];
        [result] = await getPool().query<OkPacket>(
            `insert into link (tenant_id, link_title, link_url, display_order, online)
            values (?, ?, ?, ?, ?)`,
            values,
        );
    } catch (e) {
        logger.error(`DB error creating link: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
    const createdLink: Link = await getLinkById(result.insertId, tenantId);
    return createdLink;
}

export async function updateLink(id: number, link: Link, tenantId: string): Promise<Link> {
    const onlineValue = link.online === undefined ? 1 : Number(link.online);
    const values = [
        link.linkTitle,
        link.linkUrl,
        link.linkDisplayOrder,
        onlineValue,
        id,
        tenantId,
    ];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(
            `update link set
            link_title = ?, link_url = ?, display_order = ?, online = ?, updated_at = CURRENT_TIMESTAMP
            where link_id = ? and tenant_id = ?`,
            values,
        );
    } catch (e) {
        logger.error(`DB error updating link: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
    const updatedLink: Link = await getLinkById(id, tenantId);
    return updatedLink;
}
