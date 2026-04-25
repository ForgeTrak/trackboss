import { Request, Response, Router } from 'express';
import { format } from 'date-fns';
import { RowDataPacket } from 'mysql2';
import { checkHeader, verify } from '../util/auth';
import logger from '../logger';
import { getEventList } from '../database/event';
import { getWorkPointsByMembership } from '../database/workPoints';
import { getWorkPointThreshold, getBillList, getLatestBillMembership } from '../database/billing';
import { getRidingAreaStatuses } from '../database/ridingAreaStatus';
import { getLinks } from '../database/link';
import { getPool } from '../database/pool';

const dashboard = Router();

dashboard.get('/', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        res.send({ reason: headerCheck.reason });
        return;
    }
    try {
        const token = await verify(headerCheck.token);
        const tenantId = token.active_tenant_id as string;
        const membershipId = Number(req.query.membershipId);

        const now = new Date();
        const year = now.getFullYear();
        const todayString = format(now, 'yyyyMMdd');

        // Run all DB queries in parallel - single Lambda invocation
        const [
            eventList,
            workPoints,
            threshold,
            bills,
            ridingAreaStatuses,
            links,
            latestBill,
        ] = await Promise.allSettled([
            getEventList(tenantId, format(now, 'yyyy-MM-dd')),
            getWorkPointsByMembership(membershipId, year, tenantId),
            getWorkPointThreshold(year, tenantId),
            getBillList({ membershipId, membershipStatus: 'Active' }, tenantId),
            getRidingAreaStatuses(tenantId),
            getLinks(tenantId),
            getLatestBillMembership(membershipId, tenantId),
        ]);

        // Build gate code response based on billing status
        let gateCode: any = { id: -99, year, message: 'Billing or insurance required' };
        if (latestBill.status === 'fulfilled' && latestBill.value.curYearIns && latestBill.value.curYearPaid) {
            // eslint-disable-next-line max-len
            const [results] = await getPool().query<RowDataPacket[]>("select default_setting_value gate_code from default_settings where default_setting_name = 'GATE_CODE'");
            if (results.length > 0) {
                gateCode = { id: results[0].gate_code_id, year: results[0].year, gateCode: results[0].gate_code };
            }
        }

        const response = {
            eventList: eventList.status === 'fulfilled' ? eventList.value : [],
            workPoints: workPoints.status === 'fulfilled' ? workPoints.value : { total: 0 },
            threshold: threshold.status === 'fulfilled' ? threshold.value : { year, threshold: 0 },
            bills: bills.status === 'fulfilled' ? bills.value : [],
            ridingAreaStatuses: ridingAreaStatuses.status === 'fulfilled' ? ridingAreaStatuses.value : [],
            links: links.status === 'fulfilled' ? links.value : [],
            gateCode,
        };

        res.status(200);
        res.send(response);
    } catch (e: any) {
        logger.error(`dashboard - Error at path ${req.path}`, e);
        if (e.message === 'Authorization Failed') {
            res.status(401);
            res.send({ reason: 'not authorized' });
        } else {
            res.status(500);
            res.send({ reason: 'internal server error' });
        }
    }
});

export default dashboard;
