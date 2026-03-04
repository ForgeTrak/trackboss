import _ from 'lodash';
import { OkPacket, RowDataPacket } from 'mysql2';
import { BoardMember, PatchBoardMemberRequest, PostNewBoardMemberRequest } from '../typedefs/boardMember';

import logger from '../logger';
import { getPool } from './pool';

export async function insertBoardMember(req: PostNewBoardMemberRequest): Promise<number> {
    if (_.isEmpty(req)) {
        throw new Error('user input error');
    }
    const values = [req.tenantId, req.year, req.memberId, req.boardMemberTitleId];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(
            'INSERT INTO board_member(tenant_id, year, member_id, board_title_id) VALUES (?, ?, ?, ?)',
            values,
        );
    } catch (e: any) {
        if ('errno' in e) {
            switch (e.errno) {
                case 1452: // FK violation - referenced is missing
                    logger.error(`User error inserting board member in DB: ${e}`);
                    throw new Error('user input error');
                default:
                    logger.error(`DB error inserting board member: ${e}`);
                    throw new Error('internal server error');
            }
        } else {
            // this should not happen - errors from query should always have 'errno' field
            throw e;
        }
    }

    return result.insertId;
}

export async function getBoardMemberList(tenantId: string, year?: string): Promise<BoardMember[]> {
    let sql;
    let values: string[];
    if (typeof year !== 'undefined') {
        sql = 'SELECT * FROM v_board_member WHERE tenant_id = ? AND year = ?';
        values = [tenantId, year];
    } else {
        sql = 'select * from v_board_member where tenant_id = ?';
        values = [tenantId];
    }

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(sql, values);
    } catch (e) {
        logger.error(`DB error getting board member list: ${e}`);
        throw new Error('internal server error');
    }

    return results.map((result) => ({
        tenantId: result.tenant_id,
        boardId: result.board_id,
        firstName: result.first_name,
        lastName: result.last_name,
        phone: result.phone_number,
        title: result.title,
        titleId: result.title_id,
        year: result.year,
        memberId: result.member_id,
        membershipId: result.membership_id,
        email: result.email,
    }));
}

export async function getBoardMember(tenantId: string, id: number): Promise<BoardMember> {
    const values = [tenantId, id];

    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>(
            'SELECT * FROM v_board_member WHERE tenant_id = ? AND board_id = ?',
            values,
        );
    } catch (e) {
        logger.error(`DB error getting board member: ${e}`);
        throw new Error('internal server error');
    }

    if (_.isEmpty(results)) {
        throw new Error('not found');
    }

    return {
        tenantId: results[0].tenant_id,
        boardId: results[0].board_id,
        title: results[0].title,
        titleId: results[0].title_id,
        year: results[0].year,
        memberId: results[0].member_id,
        membershipId: results[0].membership_id,
    };
}

export async function patchBoardMember(id: number, req: PatchBoardMemberRequest): Promise<void> {
    if (_.isEmpty(req)) {
        throw new Error('user input error');
    }
    const values = [req.year, req.memberId, req.boardMemberTitleId, id, req.tenantId];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(
            // eslint-disable-next-line max-len
            'UPDATE board_member SET year = ?, member_id = ?, board_title_id = ? WHERE board_id = ? AND tenant_id = ?',
            values,
        );
    } catch (e: any) {
        if ('errno' in e) {
            switch (e.errno) {
                case 1451: // FK violation - referenced somewhere else
                case 1452: // FK violation - referenced is missing
                    logger.error(`User error patching board member in DB: ${e}`);
                    throw new Error('user input error');
                default:
                    logger.error(`DB error patching board member: ${e}`);
                    throw new Error('internal server error');
            }
        } else {
            // this should not happen - errors from query should always have 'errno' field
            throw e;
        }
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}

export async function deleteBoardMember(tenantId: string, id: number): Promise<void> {
    const values = [tenantId, id];

    let result;
    try {
        [result] = await getPool().query<OkPacket>(
            'DELETE FROM board_member where tenant_id = ? AND board_id = ?',
            values,
        );
    } catch (e) {
        logger.error(`DB error deleting board member: ${e}`);
        throw new Error('internal server error');
    }

    if (result.affectedRows < 1) {
        throw new Error('not found');
    }
}
