import _ from 'lodash';
import { OkPacket, RowDataPacket } from 'mysql2';
import { MembershipTag } from '../typedefs/membershipTag';

import logger from '../logger';
import { getPool } from './pool';

function mapResultsToTags(result: any) : MembershipTag[] {
    const tags : MembershipTag[] = [];
    result?.forEach((row : any) => {
        const tag : MembershipTag = {
            id: row.membership_tag_id,
            tenantId: row.tenant_id,
            value: row.membership_tag,
            membershipId: row.membership_id,
            count: row.tag_count,
        };
        tags.push(tag);
    });
    return tags;
}

export async function getMembershipTags(membershipId: number, tenantId: string) : Promise<MembershipTag[]> {
    let result;

    try {
        [result] = await getPool().query<RowDataPacket[]>(
            // eslint-disable-next-line max-len
            'select membership_tag_id, membership_tag, membership_id from membership_tags where membership_id = ? and tenant_id = ? order by membership_tag',
            [membershipId, tenantId],
        );
    } catch (e) {
        logger.error(`DB error getting tags for membership ID ${membershipId}`, e);
    }
    return mapResultsToTags(result);
}

export async function createMembershipTag(
    membershipId: number, tags: string[],
    tenantId: string,
) : Promise<MembershipTag[]> {
    try {
        const insertSql = 'insert into membership_tags(membership_id, membership_tag, tenant_id) values (?, ?, ?)';
        await Promise.all(tags.map(async (tag) => {
            await getPool().query<OkPacket>(insertSql, [membershipId, tag, tenantId]);
        }));
    } catch (error) {
        logger.error(`Error inserting tags ${tags.join(',')} for membershipID ${membershipId}`, error);
    }
    const newTags = await getMembershipTags(membershipId, tenantId);
    return newTags;
}

// eslint-disable-next-line max-len
export async function deleteMembershipTag(membershipId: number, tags: string[], tenantId: string) : Promise<MembershipTag[]> {
    try {
        // eslint-disable-next-line max-len
        const deleteSql = 'delete from membership_tags where membership_id = ? and membership_tag = ? and tenant_id = ?';
        tags.forEach(async (tag) => {
            await getPool().query<OkPacket>(deleteSql, [membershipId, tag, tenantId]);
        });
    } catch (error) {
        logger.error(`Error deleting tags ${tags.join(',')} for membershipID ${membershipId}`, error);
    }
    const newTags = await getMembershipTags(membershipId, tenantId);
    return newTags;
}

export async function cleanMembershipTags(membershipId: number, tenantId: string) : Promise<MembershipTag[]> {
    try {
        const deleteSql = 'delete from membership_tags where membership_id = ? and tenant_id = ?';
        await getPool().query<OkPacket>(deleteSql, [membershipId, tenantId]);
    } catch (error) {
        logger.error(`Error deleting tags for membershipID ${membershipId}`, error);
    }
    const newTags = await getMembershipTags(membershipId, tenantId);
    return newTags;
}

export async function getUniqueTags(tenantId: string) : Promise<MembershipTag[]> {
    let result;

    try {
        // eslint-disable-next-line max-len
        [result] = await getPool().query<RowDataPacket[]>('select distinct membership_tag, count(*) tag_count from membership_tags where tenant_id = ? group by membership_tag', [tenantId]);
    } catch (e) {
        logger.error('DB error getting unique membership tags', e);
    }
    return mapResultsToTags(result);
}
