import bodyParser from 'body-parser';
import { Request, Response, Router } from 'express';
import { getMember } from '../database/member';
import { checkHeader, verify } from '../util/auth';
import bike from './bike';
import billing from './billing';
import boardMember from './boardMember';
import boardMemberType from './boardMemberType';
import event from './event';
import eventJob from './eventJob';
import eventType from './eventType';
import job from './job';
import jobType from './jobType';
import member from './member';
import membership from './membership';
import memberType from './memberType';
import workPoints from './workPoints';
import health from './health';
import gateCode from './gateCode';
import membershipApplication from './membershipApplication';
import logger from '../logger';
import ridingAreaStatus from './ridingAreaStatus';
import memberCommunication from './memberCommunication';
import membershipTags from './membershipTags';
import link from './link';
import paidLabor from './paidLabor';
import defaultSetting from './defaultSetting';
import auditLog from './auditLog';
import dashboard from './dashboard';
import tenant from './tenant';

const api = Router();

api.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', '*');
    next();
});
api.use(bodyParser.json());

// Lightweight readiness probe for Lambda Web Adapter - no DB dependency
api.get('/health/readiness', (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
});

api.get('/me', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const payload = await verify(headerCheck.token);
            const uuid = payload['cognito:username'];
            const tenantId = payload.active_tenant_id as string;
            try {
                // TODO: tenant ID
                response = await getMember(uuid, tenantId);
                logger.info(`login - Login successful for ${response.email} (user id: ${uuid}) on tenant ${tenantId}`);
                res.status(200);
            } catch (e: any) {
                logger.error('login - Error occurred while fetching member', e);
                if (e.message === 'not found') {
                    res.status(404);
                    response = { reason: 'not found' };
                } else {
                    res.status(500);
                    response = { reason: 'internal server error' };
                }
            }
        } catch (e) {
            res.status(401);
            response = { reason: 'Invalid token' };
        }
    }
    res.send(response);
});

api.use('/member', member);
api.use('/memberType', memberType);
api.use('/membership', membership);
api.use('/bike', bike);
api.use('/event', event);
api.use('/eventType', eventType);
api.use('/job', job);
api.use('/jobType', jobType);
api.use('/workPoints', workPoints);
api.use('/eventJob', eventJob);
api.use('/billing', billing);
api.use('/boardMember', boardMember);
api.use('/boardMemberType', boardMemberType);
api.use('/health', health);
api.use('/gateCode', gateCode);
api.use('/membershipApplication', membershipApplication);
api.use('/ridingAreaStatus', ridingAreaStatus);
api.use('/memberCommunication', memberCommunication);
api.use('/membershipTags', membershipTags);
api.use('/link', link);
api.use('/paidLabor', paidLabor);
api.use('/defaultSettings', defaultSetting);
api.use('/auditLog', auditLog);
api.use('/dashboard', dashboard);
api.use('/tenant', tenant);
export default api;
