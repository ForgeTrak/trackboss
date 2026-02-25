import 'express';

declare global {
  namespace Express {
    interface Request {
      user: {
        tenantId: string;
        uuid: string;
      };
    }
  }
}
