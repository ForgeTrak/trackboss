import 'dotenv/config';
import express from 'express';
import AWS from 'aws-sdk';
import api from './api/api';
import logger from './logger';
import { checkHeader, createVerifier, verify } from './util/auth';
import { getEnvironmentParameter } from './util/environmentWrapper';
import { configReady } from './database/pool';
import startBillingJob from './jobs/billingJob';

process.on('uncaughtException', (error, origin) => {
    logger.error('----- Uncaught exception -----');
    logger.error(error);
    logger.error('----- Exception origin -----');
    logger.error(origin);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('----- Unhandled Rejection at -----');
    logger.error(promise);
    logger.error('----- Reason -----');
    logger.error(reason);
});

const app = express();

const port = process.env.PORT || 8080;

createVerifier();

AWS.config.update({ region: 'us-east-1' });

const addTenantToRequest = async (req : any, res : any, next : () => void) => {
    const headerCheck = checkHeader(req.headers.authorization);
    if (headerCheck.token) {
        try {
            const verifiedToken = await verify(headerCheck.token);
            const tenantId = verifiedToken.active_tenant_id as string;
            const uuid = verifiedToken['cognito:username'];
            req.user = {
                tenantId,
                uuid,
                email: verifiedToken.email,
            };
        } catch (e: any) {
            logger.warn(`Token verification failed in middleware: ${e.message}`);
        }
    }
    next();
};

app.use(addTenantToRequest);

app.use('/api', api);
app.use((err: any, req: any, res: any, next: () => void) => {
    logger.error(`got an error going to ${req.route}.  That error was`);
    logger.error(err);
    next();
});

const server = (async () => {
    await configReady;
    return app.listen(port, async () => {
        const envName = await getEnvironmentParameter('trackbossEnvironmentName');
        logger.info(`Forgetrak API environment ${envName} listening on port ${port}`);
    });
})();

startBillingJob();

// export the HTTP server so that it can be closed if necessary (mostly for testing)
export default server;
