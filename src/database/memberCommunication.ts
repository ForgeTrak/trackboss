import { OkPacket, RowDataPacket } from 'mysql2';
import { MemberCommunication } from '../typedefs/memberCommunication';

import logger from '../logger';
import { getPool } from './pool';

export async function getMemberCommunications(tenantId: string): Promise<MemberCommunication[]> {
    const sql = `
        select 
        mc.*, concat_ws(', ', m.last_name, m.first_name) sender_name
        FROM 
        member_communication mc left join member m on 
        sender_id = member_id
        where mc.tenant_id = ?
    `;
    const values: string[] = [tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting member communications list: ${e}`);
        throw new Error('internal server error');
    }
    return results.map((result) => ({
        memberCommunicationId: result.member_communication_id,
        tenantId: result.tenant_id,
        subject: result.subject,
        mechanism: result.mechanism,
        senderId: result.sender_id,
        senderName: result.sender_name,
        text: result.text,
        selectedTags: result.selected_tags,
        sentDate: new Date(result.creation_date),
    }));
}

export async function getMemberCommunicationById(id :number, tenantId: string) : Promise<MemberCommunication> {
    const sql = `
        select 
        mc.*, concat_ws(', ', m.last_name, m.first_name) sender_name
        FROM 
        member_communication mc left join member m on 
        sender_id = member_id
        where mc.member_communication_id = ? and mc.tenant_id = ?
    `;
    const values: any[] = [id, tenantId];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting member communications list: ${e}`);
        throw new Error('internal server error');
    }
    return {
        memberCommunicationId: results[0].member_communication_id,
        tenantId: results[0].tenant_id,
        subject: results[0].subject,
        mechanism: results[0].mechanism,
        senderId: results[0].sender_id,
        senderName: results[0].sender_name,
        text: results[0].text,
        selectedTags: results[0].selected_tags,
        members: results[0].recipients,
        sentDate: results[0].creation_date,
    };
}

export async function insertMemberCommunication(
    communication: MemberCommunication,
    tenantId: string,
) : Promise<MemberCommunication> {
    const values: any[] = [communication.subject, communication.senderId, communication.text,
        communication.mechanism, JSON.stringify(communication.members),
        JSON.stringify(communication.selectedTags), tenantId,
    ];
    let result;
    // eslint-disable-next-line max-len
    const insertSql = 'insert into member_communication (subject, sender_id, text, mechanism, recipients, selected_tags, tenant_id) values (?, ?, ?, ?, ?, ?, ?)';
    try {
        [result] = await getPool().query<OkPacket>(insertSql, values);
        logger.info(`Inserted communication with id ${result.insertId}`);
    } catch (e: any) {
        logger.error(e);
        throw e;
    }
    const newComm = await getMemberCommunicationById(result.insertId, tenantId);
    return newComm;
}
