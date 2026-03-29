import express, { Express } from 'express';
import request from 'supertest';
import health from '../../api/health';
import { getPool } from '../../database/pool';

jest.mock('../../database/pool');

const mockedGetPool = getPool as jest.MockedFunction<typeof getPool>;

function createApp(): Express {
    const app = express();
    app.use('/health', health);
    return app;
}

describe('api/health router', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 200 and dbtime when the database query succeeds', async () => {
        const mockQuery = jest
            .fn()
            .mockResolvedValue([[{ dbtime: '2026-03-28 12:00:00' }]]);
        mockedGetPool.mockReturnValue({ query: mockQuery } as any);

        const res = await request(createApp()).get('/health/');

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            ok: true,
            dbtime: '2026-03-28 12:00:00',
        });
        expect(mockQuery).toHaveBeenCalledWith('select now() dbtime from dual');
    });

    it('returns 500 when the database query fails', async () => {
        // health.ts uses e.getMessage() (Java-style); plain Error would throw here.
        const dbError = { getMessage: () => 'connection refused' };
        const mockQuery = jest.fn().mockRejectedValue(dbError);
        mockedGetPool.mockReturnValue({ query: mockQuery } as any);

        const res = await request(createApp()).get('/health/');

        expect(res.status).toBe(500);
        expect(res.body).toMatchObject({
            ok: false,
            dbtime: '',
            error: 'connection refused',
        });
    });
});
