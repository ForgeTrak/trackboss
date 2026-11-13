import { describe, it, expect } from 'vitest';
import roundToQuarter from '../../util/points';

describe('roundToQuarter', () => {
    it('keeps quarter values unchanged', () => {
        expect(roundToQuarter(0)).toBe(0);
        expect(roundToQuarter(1.25)).toBe(1.25);
        expect(roundToQuarter(2.5)).toBe(2.5);
        expect(roundToQuarter(3.75)).toBe(3.75);
    });

    it('rounds to the nearest quarter', () => {
        expect(roundToQuarter(2.7)).toBe(2.75);
        expect(roundToQuarter(2.6)).toBe(2.5);
        expect(roundToQuarter(1.8)).toBe(1.75);
        expect(roundToQuarter(0.1)).toBe(0);
    });

    it('returns 0 for non-finite input', () => {
        expect(roundToQuarter(NaN)).toBe(0);
        expect(roundToQuarter(Infinity)).toBe(0);
    });
});
