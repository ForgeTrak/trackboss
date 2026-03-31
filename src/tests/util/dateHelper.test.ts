import {
    calculateApplicationYear,
    calculateBillingYear,
    calculateStartDate,
} from '../../util/dateHelper';

describe('util/dateHelper', () => {
    describe('calculateStartDate', () => {
        it('shifts by job day number (Wednesday=1)', () => {
            expect(calculateStartDate('2026-06-01T12:00:00.000Z', 1)).toBe('2026-06-01');
            expect(calculateStartDate('2026-06-01T12:00:00.000Z', 3)).toBe('2026-06-03');
        });

        it('defaults job day to 1 when zero', () => {
            expect(calculateStartDate('2026-01-10T12:00:00.000Z', 0)).toBe('2026-01-10');
        });
    });

    describe('calculateBillingYear', () => {
        afterEach(() => {
            jest.useRealTimers();
        });

        it('returns prior year when current date is before November of this year', () => {
            jest.useFakeTimers({ advanceTimers: true });
            jest.setSystemTime(new Date(2026, 2, 15));
            expect(calculateBillingYear()).toBe(2025);
        });

        it('returns current year when date is on or after November 1', () => {
            jest.useFakeTimers({ advanceTimers: true });
            jest.setSystemTime(new Date(2026, 10, 15));
            expect(calculateBillingYear()).toBe(2026);
        });
    });

    describe('calculateApplicationYear', () => {
        afterEach(() => {
            jest.useRealTimers();
        });

        it('returns same year when not after August 1 cutoff', () => {
            jest.useFakeTimers({ advanceTimers: true });
            jest.setSystemTime(new Date(2026, 6, 15));
            expect(calculateApplicationYear()).toBe(2026);
        });

        it('returns next year when after August 31', () => {
            jest.useFakeTimers({ advanceTimers: true });
            jest.setSystemTime(new Date(2026, 8, 15));
            expect(calculateApplicationYear()).toBe(2027);
        });
    });
});
