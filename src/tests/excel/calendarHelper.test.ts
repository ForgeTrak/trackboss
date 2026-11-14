import { Response } from 'express';
import {
    buildCalendarSheet,
    CALENDAR_CATEGORIES,
    categorize,
    categorizeEvents,
    formatEventDates,
    getDayCategories,
    httpOutputCalendar,
} from '../../excel/calendarHelper';
import { Event } from '../../typedefs/event';

function makeEvent(title: string, eventType: string, start: string, end: string): Event {
    return {
        eventId: 1,
        tenantId: 't1',
        start,
        end,
        eventType,
        eventTypeId: 1,
        title,
        eventDescription: '',
        restrictSignups: false,
    };
}

const byName = (name: string) => CALENDAR_CATEGORIES.find((c) => c.name === name)!;

// layout constants mirrored from the helper: months are 4 per band, 9 rows per band, 8 columns per month
function monthOrigin(month: number) {
    return { row: Math.floor(month / 4) * 9, col: 2 + (month % 4) * 8 };
}

function findDayCell(data: any[][], month: number, day: number) {
    const { row, col } = monthOrigin(month);
    for (let r = row + 2; r < row + 8; r += 1) {
        for (let c = col; c < col + 7; c += 1) {
            if (data[r][c]?.value === String(day)) return data[r][c];
        }
    }
    return undefined;
}

describe('calendarHelper', () => {
    describe('categorize', () => {
        it.each([
            ['Meeting', 'General Club Meeting'],
            ['ZZZMeeting (no points)', 'General Club Meeting'],
            ['Work Day', 'Work Day'],
            ['Tuesday Jobs', 'Track Closed'],
            ['Watering', 'Track Closed'],
            ['Race', 'Race Weekend'],
            ['Harescramble', 'Race Weekend'],
            ['Executive Board Meeting', 'Executive Board Meeting'],
            ['New Member Orientation Meeting', 'Special Event'],
            ['Camp and Ride', 'Special Event'],
            ['', 'Special Event'],
        ])('maps event type "%s" to %s', (eventType, expected) => {
            expect(categorize(eventType).name).toBe(expected);
        });
    });

    describe('categorizeEvents', () => {
        it('drops events outside the year, sorts by start, and repairs invalid end dates', () => {
            const events = categorizeEvents(2026, [
                makeEvent('Late', 'Race', '2026-08-29 07:00:00', '2026-08-30 19:00:00'),
                makeEvent('Bad End', 'Work Day', '2026-05-02 09:00:00', '0000-00-00 00:00:00'),
                makeEvent('Other Year', 'Race', '2025-05-02 09:00:00', '2025-05-02 10:00:00'),
                makeEvent('NYE', 'Camp and Ride', '2025-12-31 20:00:00', '2026-01-01 02:00:00'),
            ]);
            expect(events.map((e) => e.title)).toEqual(['NYE', 'Bad End', 'Late']);
            expect(events[1].end).toEqual(events[1].start);
        });
    });

    describe('getDayCategories', () => {
        it('colors every day of a multi-day event and lets higher priority categories win', () => {
            const days = getDayCategories(2026, categorizeEvents(2026, [
                makeEvent('Jobs', 'Friday Jobs', '2026-05-08 16:00:00', '2026-05-09 23:00:00'),
                makeEvent('May Race', 'Race', '2026-05-09 16:00:00', '2026-05-10 23:00:00'),
                makeEvent('Spill', 'Camp and Ride', '2026-12-31 08:00:00', '2027-01-02 08:00:00'),
            ]));
            expect(days.get('2026-05-08')).toBe(byName('Track Closed'));
            expect(days.get('2026-05-09')).toBe(byName('Race Weekend'));
            expect(days.get('2026-05-10')).toBe(byName('Race Weekend'));
            expect(days.get('2026-12-31')).toBe(byName('Special Event'));
            expect(days.has('2027-01-01')).toBe(false);
        });
    });

    describe('formatEventDates', () => {
        it('formats single, same-month and cross-month ranges', () => {
            const d = (s: string) => new Date(s);
            expect(formatEventDates(d('2026-11-01T07:00'), d('2026-11-01T19:00'))).toBe('November 1st');
            expect(formatEventDates(d('2026-05-09T07:00'), d('2026-05-10T19:00'))).toBe('May 9th - 10th');
            expect(formatEventDates(d('2026-07-31T07:00'), d('2026-08-02T19:00'))).toBe('July 31st - August 2nd');
        });
    });

    describe('buildCalendarSheet', () => {
        const events = [
            makeEvent('May Moto Race', 'Race', '2026-05-09 16:00:00', '2026-05-10 23:00:00'),
            makeEvent('Opening Work Day', 'Work Day', '2026-04-11 09:00:00', '2026-04-11 12:00:00'),
            makeEvent('Orientation #1', 'New Member Orientation Meeting', '2026-03-15 10:00:00', '2026-03-15 11:00:00'),
        ];
        const sheet = buildCalendarSheet(2026, events, 'PRA Club');
        const data = sheet.data as any[][];

        it('is a single landscape sheet without gridlines', () => {
            expect(sheet.sheet).toBe('2026 Calendar');
            expect(sheet.orientation).toBe('landscape');
            expect(sheet.showGridLines).toBe(false);
            expect(sheet.columns).toHaveLength(data[0].length);
        });

        it('renders the title and legend in the left panel', () => {
            expect(data[0][0].value).toBe('2026 PRA Club Calendar');
            expect(data[0][0].rowSpan).toBe(3);
            const legend = data.slice(3, 3 + CALENDAR_CATEGORIES.length).map((row) => row[0]);
            expect(legend.map((c) => c.value)).toEqual(CALENDAR_CATEGORIES.map((c) => c.name));
            expect(legend.map((c) => c.backgroundColor)).toEqual(CALENDAR_CATEGORIES.map((c) => c.color));
        });

        it('lists race dates and special events in the left panel', () => {
            const leftText = data.map((row) => row[0]?.value).filter(Boolean);
            const raceIdx = leftText.indexOf('Race Dates');
            const specialIdx = leftText.indexOf('Special Events');
            expect(leftText[raceIdx + 1]).toBe('May 9th - 10th - May Moto Race');
            expect(leftText[specialIdx + 1]).toBe('March 15th - Orientation #1');
            expect(leftText).not.toContain('April 11th - Opening Work Day');
        });

        it('lays out all 12 months in a 4x3 grid with colored event days', () => {
            ['JANUARY', 'APRIL', 'MAY', 'AUGUST', 'SEPTEMBER', 'DECEMBER'].forEach((name) => {
                const month = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST',
                    'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'].indexOf(name);
                const { row, col } = monthOrigin(month);
                expect(data[row][col].value).toBe(name);
                expect(data[row][col].columnSpan).toBe(7);
            });
            // May 1st 2026 is a Friday (column offset 5) in the first week row
            const may = monthOrigin(4);
            expect(data[may.row + 2][may.col + 5].value).toBe('1');
            expect(findDayCell(data, 4, 9).backgroundColor).toBe(byName('Race Weekend').color);
            expect(findDayCell(data, 4, 10).backgroundColor).toBe(byName('Race Weekend').color);
            expect(findDayCell(data, 3, 11).backgroundColor).toBe(byName('Work Day').color);
            expect(findDayCell(data, 2, 15).backgroundColor).toBe(byName('Special Event').color);
            expect(findDayCell(data, 4, 11).backgroundColor).toBeUndefined();
            expect(findDayCell(data, 1, 28)).toBeDefined();
            expect(findDayCell(data, 1, 29)).toBeUndefined();
        });

        it('shows TBD when there are no race or special events and grows rows for long lists', () => {
            const empty = buildCalendarSheet(2026, [], 'X').data as any[][];
            const leftText = empty.map((row) => row[0]?.value).filter(Boolean);
            expect(leftText.filter((v) => v === 'TBD')).toHaveLength(2);

            const many = Array.from({ length: 30 }, (_, i) => makeEvent(
                `Race ${i}`,
                'Race',
                `2026-06-${String((i % 28) + 1).padStart(2, '0')} 08:00:00`,
                `2026-06-${String((i % 28) + 1).padStart(2, '0')} 09:00:00`,
            ));
            const tall = buildCalendarSheet(2026, many, 'X').data as any[][];
            expect(tall.length).toBeGreaterThan(27);
            expect(tall.every((row) => typeof row[1].height === 'number')).toBe(true);
        });
    });

    describe('httpOutputCalendar', () => {
        it('sends an xlsx buffer with download headers', async () => {
            const res = { setHeader: jest.fn(), send: jest.fn() } as unknown as Response;
            await httpOutputCalendar(
                2026,
                [makeEvent('Race', 'Race', '2026-03-14 10:00:00', '2026-03-14 12:00:00')],
                'PRA Club',
                res,
                'calendar-2026',
            );
            expect(res.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
            expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=calendar-2026.xlsx');
            const buffer = (res.send as jest.Mock).mock.calls[0][0];
            expect(Buffer.isBuffer(buffer)).toBe(true);
            // xlsx files are zip archives
            expect(buffer.subarray(0, 2).toString()).toBe('PK');
        });
    });
});
