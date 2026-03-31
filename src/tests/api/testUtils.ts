import type { Express, RequestHandler } from 'express';
import express from 'express';

export const TEST_USER = {
    tenantId: 'tenant-test',
    uuid: 'user-test',
    email: 't@example.com',
};

export const attachTestUser: RequestHandler = (req: any, _res, next) => {
    req.user = { ...TEST_USER };
    next();
};

export function createRouterApp(path: string, router: Express): Express {
    const app = express();
    app.use(attachTestUser);
    app.use(path, router);
    return app;
}

export function createJsonRouterApp(path: string, router: Express): Express {
    const app = express();
    app.use(express.json());
    app.use(attachTestUser);
    app.use(path, router);
    return app;
}
