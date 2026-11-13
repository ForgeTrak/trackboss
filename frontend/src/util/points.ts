export default function roundToQuarter(value: number): number {
    return Number.isFinite(value) ? Math.round(value * 4) / 4 : 0;
}
