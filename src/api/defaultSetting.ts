import { Request, Response, Router } from 'express';
import {
    DefaultSetting,
    GetDefaultSettingsResponse,
} from '../typedefs/defaultSetting';
import {
    getDefaultSetting, getAllDefaultSettings, getDefaultSettingValue,
    deleteDefaultSetting, insertDefaultSetting,
    updateDefaultSetting,
} from '../database/defaultSettings';
import { checkHeader, validateAdminAccess } from '../util/auth';
import getBackupFile from '../util/s3';

import logger from '../logger';
import logAuditEvent from '../database/auditLog';

const defaultSetting = Router();

defaultSetting.get('/', async (req: Request, res: Response) => {
    let response: GetDefaultSettingsResponse;
    try {
        await validateAdminAccess(req, res);
        const settings: DefaultSetting[] = await getAllDefaultSettings(req.user.tenantId);
        res.status(200);
        response = settings;
        res.send(response);
    } catch (e: any) {
        logger.error(`Error at path ${req.path}`);
        logger.error(e);
        if (e.message === 'Authorization Failed') {
            res.status(401);
            response = { reason: 'not authorized' };
        } else {
            res.status(500);
            response = { reason: 'internal server error' };
        }
        res.send(response);
    }
});

defaultSetting.get('/:settingName', async (req: Request, res: Response) => {
    try {
        const headerCheck = checkHeader(req.headers.authorization);
        if (!headerCheck.valid) {
            res.status(401).send({ reason: headerCheck.reason });
        }
        const { settingName } = req.params;
        const setting = await getDefaultSetting(settingName, req.user.tenantId);
        res.send(setting);
    } catch (error: any) {
        logger.error(`Error at path ${req.path}`);
        logger.error(error);
        res.status(500);
        res.send(error);
    }
});

defaultSetting.get('/applications/enabled', async (req: Request, res: Response) => {
    try {
        const setting = await getDefaultSetting('ALLOW_APPLICATIONS', 'ad6a18d1-d963-11f0-858e-1284e6c74c95');
        res.send(setting);
    } catch (error: any) {
        logger.error(`Error at path ${req.path}`);
        logger.error(error);
        res.status(500);
        res.send(error);
    }
});

defaultSetting.put('/:id', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const before = await getDefaultSetting(req.body.settingName, req.user.tenantId);
        const patchedSetting = await updateDefaultSetting(Number(req.params.id), req.body, req.user.tenantId);
        logAuditEvent(req, 'defaultSetting', Number(req.params.id), before, patchedSetting);
        res.json(patchedSetting);
    } catch (error: any) {
        logger.error(`Error at path ${req.path}`);
        logger.error(error);
        res.status(500);
        res.send(error);
    }
});

defaultSetting.post('/', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const newSetting : DefaultSetting = req.body;
        await insertDefaultSetting(newSetting, req.user.tenantId);
        const savedNewSetting = await getDefaultSetting(newSetting.settingName, req.user.tenantId);
        logAuditEvent(req, 'defaultSetting', null, null, savedNewSetting);
        res.json(savedNewSetting);
    } catch (error: any) {
        logger.error(`Error at path ${req.path}`);
        logger.error(error);
        res.status(500);
        res.send(error);
    }
});

defaultSetting.delete('/:id', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const before = await getDefaultSettingValue((req.params.id), req.user.tenantId);
        await deleteDefaultSetting(Number(req.params.id), req.user.tenantId);
        logAuditEvent(req, 'defaultSetting', Number(req.params.id), before, null);
        res.status(200);
        res.send('deleted default setting');
    } catch (error: any) {
        logger.error(`Error at path ${req.path}`);
        logger.error(error);
        res.status(500);
        res.send(error);
    }
});

defaultSetting.get('/admin/databackup', async (req: Request, res: Response) => {
    try {
        const authorization = req.query.id as string;
        const headerCheck = checkHeader(`Bearer ${authorization}`);
        if (!headerCheck.valid) {
            res.status(401);
        } else {
            const dataBackupBuffer = await getBackupFile();
            res.setHeader('Content-Disposition', 'attachment; filename=databackup.sql.gz');
            res.setHeader('Content-Type', 'application/gzip');
            res.send(dataBackupBuffer);
        }
    } catch (error: any) {
        logger.error(`Error at path ${req.path}`);
        logger.error(error);
        res.status(500);
        res.send(error);
    }
});

export default defaultSetting;
