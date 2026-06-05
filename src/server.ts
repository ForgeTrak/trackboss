import 'dotenv/config';
import express from 'express';
import api from './api/api';
import logger from './logger';
import { checkHeader, createVerifier, verify } from './util/auth';
import { getEnvironmentParameter } from './util/environmentWrapper';
import { getTenantBySlug } from './database/tenant';
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

const verifierReady = createVerifier();

/**
 * Extract the subdomain (slug) from the request Origin header.
 * Returns undefined when Origin is missing or has no subdomain.
 */
function getSlugFromOrigin(origin: string | undefined): string | undefined {
    if (!origin) return undefined;
    try {
        const { hostname } = new URL(origin);
        const parts = hostname.split('.');
        // Expect at least slug.domain.tld (3 parts) to treat first part as slug
        if (parts.length >= 3) {
            return parts[0];
        }
        // For local dev (e.g. localhost) fall back to first part if there's only one dot
        if (parts.length === 1 && parts[0] === 'localhost') {
            return parts[0];
        }
    } catch { /* malformed origin - ignore */ }
    return undefined;
}

const addTenantToRequest = async (req : any, res : any, next : () => void) => {
    const headerCheck = checkHeader(req.headers.authorization);
    if (headerCheck.token) {
        try {
            const verifiedToken = await verify(headerCheck.token);
            let tenantId = verifiedToken.active_tenant_id as string;
            const uuid = verifiedToken['cognito:username'];

            // Resolve tenant from Origin header and validate against user's tenant list
            const slug = getSlugFromOrigin(req.headers.origin);
            if (slug) {
                try {
                    const originTenant = await getTenantBySlug(slug);
                    const userTenants: string[] = JSON.parse((verifiedToken.tenant_ids as string) || '[]');
                    if (userTenants.includes(originTenant.tenantId)) {
                        tenantId = originTenant.tenantId;
                    } else {
                        logger.warn(`Tenant ${originTenant.tenantId} (slug: ${slug}) not in user's tenant list`);
                    }
                } catch (e: any) {
                    // Slug not found or DB error - fall back to token's active_tenant_id
                    logger.debug(`Origin tenant resolution failed for slug '${slug}': ${e.message}`);
                }
            }

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
    await Promise.all([configReady, verifierReady]);
    return app.listen(port, async () => {
        logger.info(`Forgetrak API environment listening on port ${port}`);
    });
})();

// export the HTTP server so that it can be closed if necessary (mostly for testing)
export default server;
