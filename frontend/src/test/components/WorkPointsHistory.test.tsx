import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Job } from '../../../../src/typedefs/job';
import { filterJobsByYear } from '../../components/WorkPointsHistory';

describe('filterJobsByYear', () => {
    const originalTz = process.env.TZ;

    beforeAll(() => {
        process.env.TZ = 'America/New_York';
    });

    afterAll(() => {
        process.env.TZ = originalTz;
    });

    const newYearsJob = { jobId: 1, title: 'New Years', start: '2026-01-01T00:00:00.000Z' } as unknown as Job;
    const newYearsEveJob = { jobId: 2, title: 'NYE', start: '2025-12-31T23:59:00.000Z' } as unknown as Job;

    it('includes a job entered at midnight on January 1st in that year', () => {
        expect(filterJobsByYear([newYearsJob, newYearsEveJob], 2026)).toEqual([newYearsJob]);
    });

    it('does not move a January 1st midnight job into the previous year', () => {
        expect(filterJobsByYear([newYearsJob, newYearsEveJob], 2025)).toEqual([newYearsEveJob]);
    });
});
