import { Request, Response, Router } from 'express';
import { RowDataPacket } from 'mysql2';
import { GetGateCodeResponse, PostGateCodeResponse } from '../typedefs/gateCode';
import { checkHeader, verify } from '../util/auth';
import { getPool } from '../database/pool';
import logger from '../logger';
import { getLatestBillMembership } from '../database/billing';

const getGateCodeByYear = async (year:string) => {
    const [results] =
        await getPool().query<RowDataPacket[]>('select * from gate_code where year = ?', [year]);
    if (results.length === 0) throw new Error('not found');
    return {
        id: results[0].gate_code_id,
        year: results[0].year,
        gateCode: results[0].gate_code,
    };
};

const getGateCodeLatest = async () => {
    const [results] =
        // eslint-disable-next-line max-len
        await getPool().query<RowDataPacket[]>('select default_setting_value gate_code from default_settings where default_setting_name = \'GATE_CODE\'');
    if (results.length === 0) throw new Error('not found');
    return {
        id: results[0].gate_code_id,
        year: results[0].year,
        gateCode: results[0].gate_code,
    };
};

const gateCode = Router();

gateCode.get('/latest', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetGateCodeResponse;
    const headerCheck = checkHeader(authorization);

    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const membershipId = parseInt(req.query.membershipId?.toString() || '', 10);
            const latestBill = await getLatestBillMembership(membershipId, req.user.tenantId);
            if (latestBill.curYearIns && latestBill.curYearPaid) {
                response = await getGateCodeLatest();
            } else {
                response = {
                    id: -99,
                    year: (new Date()).getFullYear(),
                    message: 'Billing or insurance required',
                };
            }
            res.status(200);
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                logger.error('error getting latest gate code', e);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

gateCode.get('/:year', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetGateCodeResponse;
    const headerCheck = checkHeader(authorization);
    const { year } = req.params;

    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            response = await getGateCodeByYear(year);
            res.status(200);
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                logger.error(`error getting gate code for ${year}`, e);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

gateCode.post('/:year', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostGateCodeResponse;
    const headerCheck = checkHeader(authorization);
    const { year } = req.params;

    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const sql =
                'insert into gate_code (year, gate_code) values (?, ?)';
            const values = [req.body.year, req.body.gateCode];
            const [insertResults] =
                await getPool().query<RowDataPacket[]>(sql, values);
            response = await getGateCodeByYear(year);
            res.status(200);
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                logger.error(`error getting gate code for ${year}`, e);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

gateCode.put('/:year', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostGateCodeResponse;
    const headerCheck = checkHeader(authorization);
    const { year } = req.params;

    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const sql =
                'update gate_code set gate_code = ? where year = ?';
            const values = [req.body.gateCode, req.body.year];
            const [updateResults] =
                await getPool().query<RowDataPacket[]>(sql, values);
            response = await getGateCodeByYear(year);
            res.status(200);
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                logger.error(`error getting gate code for ${year}`, e);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

export default gateCode;
