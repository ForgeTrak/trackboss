import {
    eachDayOfInterval, endOfYear, format, getDay, getDaysInMonth, isAfter, isBefore, isSameDay, isSameMonth, isValid,
    max, min, parse, startOfDay, startOfYear,
} from 'date-fns';
import { Response } from 'express';
import writeXlsxFile from 'write-excel-file/node';
import type { CellObject, SheetData } from 'write-excel-file/node';
import { Event } from '../typedefs/event';

export interface CalendarCategory {
    name: string;
    color: string;
    // when multiple categories land on the same day, the highest priority wins the day's color
    priority: number;
    matches: (eventType: string) => boolean;
}

export const RACE_CATEGORY = 'Race Weekend';
export const SPECIAL_CATEGORY = 'Special Event';

// Listed in legend order. Event types are tenant-defined free text, so they are bucketed by keyword; anything
// that does not match a more specific category is treated as a special event.
export const CALENDAR_CATEGORIES: CalendarCategory[] = [
    {
        name: 'General Club Meeting',
        color: '#66FF33',
        priority: 3,
        matches: (t) => /meeting/i.test(t) && !/board|orientation/i.test(t),
    },
    { name: 'Work Day', color: '#FF9F2E', priority: 4, matches: (t) => /work\s*day/i.test(t) },
    { name: 'Track Closed', color: '#FFFF33', priority: 1, matches: (t) => /jobs|watering|closed/i.test(t) },
    { name: RACE_CATEGORY, color: '#FF7276', priority: 6, matches: (t) => /race|hare\s*scramble/i.test(t) },
    { name: SPECIAL_CATEGORY, color: '#5CE1E6', priority: 5, matches: () => false },
    { name: 'Executive Board Meeting', color: '#A066FF', priority: 2, matches: (t) => /board/i.test(t) },
];

export interface CategorizedEvent {
    title: string;
    start: Date;
    end: Date;
    category: CalendarCategory;
}

const EVENT_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss';
const DAY_KEY_FORMAT = 'yyyy-MM-dd';
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_PER_ROW = 4;
// month name + weekday letters + 6 weeks + spacer
const BAND_ROWS = 9;
const CALENDAR_ROWS = BAND_ROWS * 3;
const LEFT_COL = 0;
const FIRST_MONTH_COL = 2;
// 7 day columns + 1 spacer column between months
const MONTH_STRIDE = 8;
const TOTAL_COLS = FIRST_MONTH_COL + MONTHS_PER_ROW * MONTH_STRIDE - 1;
const ROW_HEIGHT = 14;
const MONTH_NAME_ROW_HEIGHT = 18;
const HEADING_FONT = 'Georgia';

function toDate(value: string | Date): Date {
    return value instanceof Date ? value : parse(value, EVENT_DATE_FORMAT, new Date());
}

export function categorize(eventType: string): CalendarCategory {
    return CALENDAR_CATEGORIES.find((category) => category.matches(eventType || '')) ??
        CALENDAR_CATEGORIES.find((category) => category.name === SPECIAL_CATEGORY) as CalendarCategory;
}

/**
 * Normalizes, categorizes and sorts the events that overlap the given year. Events with an invalid or earlier end
 * date are treated as single-day events on their start date.
 */
export function categorizeEvents(year: number, events: Event[]): CategorizedEvent[] {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(yearStart);
    return events
        .map((event) => {
            const start = toDate(event.start);
            const parsedEnd = toDate(event.end);
            const end = !isValid(parsedEnd) || isBefore(parsedEnd, start) ? start : parsedEnd;
            return { title: event.title, start, end, category: categorize(event.eventType) };
        })
        .filter((event) => isValid(event.start) && !isAfter(event.start, yearEnd) && !isBefore(event.end, yearStart))
        .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Maps each day (yyyy-MM-dd) in the year to the highest priority category of the events on that day. */
export function getDayCategories(year: number, events: CategorizedEvent[]): Map<string, CalendarCategory> {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(yearStart);
    const byDay = new Map<string, CalendarCategory>();
    events.forEach((event) => {
        eachDayOfInterval({
            start: startOfDay(max([event.start, yearStart])),
            end: startOfDay(min([event.end, yearEnd])),
        }).forEach((day) => {
            const key = format(day, DAY_KEY_FORMAT);
            const existing = byDay.get(key);
            if (!existing || existing.priority < event.category.priority) {
                byDay.set(key, event.category);
            }
        });
    });
    return byDay;
}

export function formatEventDates(start: Date, end: Date): string {
    const startText = format(start, 'MMMM do');
    if (isSameDay(start, end)) {
        return startText;
    }
    return `${startText} - ${format(end, isSameMonth(start, end) ? 'do' : 'MMMM do')}`;
}

function listLines(events: CategorizedEvent[], categoryName: string): string[] {
    return events
        .filter((event) => event.category.name === categoryName)
        .map((event) => `${formatEventDates(event.start, event.end)} - ${event.title}`);
}

function writeMonth(grid: (CellObject | null)[][], year: number, month: number, days: Map<string, CalendarCategory>) {
    const firstOfMonth = new Date(year, month, 1);
    const offset = getDay(firstOfMonth);
    const daysInMonth = getDaysInMonth(firstOfMonth);
    const top = Math.floor(month / MONTHS_PER_ROW) * BAND_ROWS;
    const left = FIRST_MONTH_COL + (month % MONTHS_PER_ROW) * MONTH_STRIDE;

    grid[top][left] = {
        value: format(firstOfMonth, 'MMMM').toUpperCase(),
        type: String,
        columnSpan: 7,
        fontWeight: 'bold',
        fontFamily: HEADING_FONT,
        fontSize: 12,
        align: 'center',
        alignVertical: 'center',
    };
    WEEKDAY_LETTERS.forEach((letter, weekday) => {
        grid[top + 1][left + weekday] = {
            value: letter, type: String, fontWeight: 'bold', fontSize: 8, align: 'center',
        };
    });
    for (let day = 1; day <= daysInMonth; day += 1) {
        const position = offset + day - 1;
        const category = days.get(format(new Date(year, month, day), DAY_KEY_FORMAT));
        grid[top + 2 + Math.floor(position / 7)][left + (position % 7)] = {
            value: String(day),
            type: String,
            fontSize: 9,
            align: 'center',
            alignVertical: 'center',
            ...(category ? { backgroundColor: category.color, fontWeight: 'bold' } : {}),
        };
    }
}

function buildLeftPanel(title: string, raceLines: string[], specialLines: string[]): (CellObject | null)[] {
    const sectionHeading = (value: string): CellObject => ({
        value, type: String, fontWeight: 'bold', fontFamily: HEADING_FONT, fontSize: 13, alignVertical: 'center',
    });
    const line = (value: string): CellObject => ({
        value, type: String, fontWeight: 'bold', fontSize: 8, alignVertical: 'center',
    });
    // title spans rows 0-2 and the legend fills rows 3-8, leaving the taller month-name row 9 as a gap
    return [
        {
            value: title,
            type: String,
            rowSpan: 3,
            wrap: true,
            fontWeight: 'bold',
            fontFamily: HEADING_FONT,
            fontSize: 16,
            align: 'center',
            alignVertical: 'center',
            borderStyle: 'medium',
        },
        null,
        null,
        ...CALENDAR_CATEGORIES.map((category): CellObject => ({
            value: category.name,
            type: String,
            fontWeight: 'bold',
            fontFamily: HEADING_FONT,
            fontSize: 10,
            indent: 1,
            alignVertical: 'center',
            backgroundColor: category.color,
            borderStyle: 'thin',
            borderColor: '#FFFFFF',
        })),
        null,
        sectionHeading('Race Dates'),
        ...(raceLines.length ? raceLines : ['TBD']).map(line),
        null,
        sectionHeading('Special Events'),
        ...(specialLines.length ? specialLines : ['TBD']).map(line),
    ];
}

/** Builds a single printable sheet: a title/legend/event list panel on the left and a 4x3 grid of months. */
export function buildCalendarSheet(year: number, events: Event[], clubName: string) {
    const categorized = categorizeEvents(year, events);
    const leftPanel = buildLeftPanel(
        `${year} ${clubName} Calendar`,
        listLines(categorized, RACE_CATEGORY),
        listLines(categorized, SPECIAL_CATEGORY),
    );
    const rowCount = Math.max(CALENDAR_ROWS, leftPanel.length);
    const grid: (CellObject | null)[][] = Array.from({ length: rowCount }, () => Array(TOTAL_COLS).fill(null));

    const days = getDayCategories(year, categorized);
    for (let month = 0; month < 12; month += 1) {
        writeMonth(grid, year, month, days);
    }
    leftPanel.forEach((cell, row) => {
        grid[row][LEFT_COL] = cell;
    });
    // row heights are driven by a blank cell in the spacer column so they stay uniform regardless of content
    grid.forEach((row, index) => {
        const isMonthNameRow = index < CALENDAR_ROWS && index % BAND_ROWS === 0;
        row[1] = { value: '', type: String, height: isMonthNameRow ? MONTH_NAME_ROW_HEIGHT : ROW_HEIGHT };
    });

    const columns = Array.from({ length: TOTAL_COLS }, (_, col) => {
        if (col === LEFT_COL) return { width: 36 };
        if (col < FIRST_MONTH_COL) return { width: 2 };
        return { width: (col - FIRST_MONTH_COL) % MONTH_STRIDE === 7 ? 1 : 2.3 };
    });

    return {
        data: grid as SheetData,
        sheet: `${year} Calendar`,
        orientation: 'landscape' as const,
        showGridLines: false,
        columns,
    };
}

export async function httpOutputCalendar(
    year: number,
    events: Event[],
    clubName: string,
    res: Response,
    filename: string,
) {
    const { data, ...options } = buildCalendarSheet(year, events, clubName);
    const buffer = await writeXlsxFile(data, options).toBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    res.send(buffer);
}
