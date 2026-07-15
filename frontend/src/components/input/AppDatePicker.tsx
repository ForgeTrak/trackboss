import React from 'react';
import { DatePicker, Portal } from '@chakra-ui/react';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { BsCalendar, BsChevronLeft, BsChevronRight, BsX } from 'react-icons/bs';

interface AppDatePickerProps {
    value?: Date,
    // eslint-disable-next-line no-unused-vars
    onChange: (date?: Date) => void,
    minDate?: Date,
    maxDate?: Date,
    required?: boolean,
    name?: string,
    clearable?: boolean,
}

function isValidDate(date?: Date): date is Date {
    return date instanceof Date && !Number.isNaN(date.getTime());
}

function dateToCalendarDate(date?: Date): CalendarDate | undefined {
    if (!isValidDate(date)) {
        return undefined;
    }
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function calendarDateToDate(value?: DateValue): Date | undefined {
    if (!value) {
        return undefined;
    }
    return new Date(value.year, value.month - 1, value.day);
}

export default function AppDatePicker(props: AppDatePickerProps) {
    const { value, onChange, minDate, maxDate, required, name, clearable } = props;

    const currentValue = dateToCalendarDate(value);

    return (
        <DatePicker.Root
            colorPalette="orange"
            name={name}
            required={required}
            width="full"
            minW={0}
            value={currentValue ? [currentValue] : undefined}
            min={dateToCalendarDate(minDate)}
            max={dateToCalendarDate(maxDate)}
            onValueChange={(details) => onChange(calendarDateToDate(details.value[0]))}
        >
            <DatePicker.Control width="full">
                <DatePicker.Input flex="1" />
                {
                    clearable && (
                        <DatePicker.ClearTrigger>
                            <BsX />
                        </DatePicker.ClearTrigger>
                    )
                }
                <DatePicker.Trigger>
                    <BsCalendar />
                </DatePicker.Trigger>
            </DatePicker.Control>
            <Portal>
                <DatePicker.Positioner>
                    <DatePicker.Content>
                        <DatePicker.View view="day">
                            <DatePicker.Context>
                                {
                                    (api) => (
                                        <>
                                            <DatePicker.ViewControl>
                                                <DatePicker.PrevTrigger>
                                                    <BsChevronLeft />
                                                </DatePicker.PrevTrigger>
                                                <DatePicker.ViewTrigger>
                                                    <DatePicker.RangeText />
                                                </DatePicker.ViewTrigger>
                                                <DatePicker.NextTrigger>
                                                    <BsChevronRight />
                                                </DatePicker.NextTrigger>
                                            </DatePicker.ViewControl>
                                            <DatePicker.Table>
                                                <DatePicker.TableHead>
                                                    <DatePicker.TableRow>
                                                        {
                                                            api.weekDays.map((weekDay, i) => (
                                                                // eslint-disable-next-line react/no-array-index-key
                                                                <DatePicker.TableHeader key={i}>
                                                                    {weekDay.short}
                                                                </DatePicker.TableHeader>
                                                            ))
                                                        }
                                                    </DatePicker.TableRow>
                                                </DatePicker.TableHead>
                                                <DatePicker.TableBody>
                                                    {
                                                        api.weeks.map((week, i) => (
                                                            // eslint-disable-next-line react/no-array-index-key
                                                            <DatePicker.TableRow key={i}>
                                                                {
                                                                    week.map((day, j) => (
                                                                        <DatePicker.TableCell
                                                                            // eslint-disable-next-line react/no-array-index-key
                                                                            key={j}
                                                                            value={day}
                                                                        >
                                                                            <DatePicker.TableCellTrigger>
                                                                                {day.day}
                                                                            </DatePicker.TableCellTrigger>
                                                                        </DatePicker.TableCell>
                                                                    ))
                                                                }
                                                            </DatePicker.TableRow>
                                                        ))
                                                    }
                                                </DatePicker.TableBody>
                                            </DatePicker.Table>
                                        </>
                                    )
                                }
                            </DatePicker.Context>
                        </DatePicker.View>
                        <DatePicker.View view="month">
                            <DatePicker.Context>
                                {
                                    (api) => (
                                        <>
                                            <DatePicker.ViewControl>
                                                <DatePicker.PrevTrigger>
                                                    <BsChevronLeft />
                                                </DatePicker.PrevTrigger>
                                                <DatePicker.ViewTrigger>
                                                    <DatePicker.RangeText />
                                                </DatePicker.ViewTrigger>
                                                <DatePicker.NextTrigger>
                                                    <BsChevronRight />
                                                </DatePicker.NextTrigger>
                                            </DatePicker.ViewControl>
                                            <DatePicker.Table>
                                                <DatePicker.TableBody>
                                                    {
                                                        api.getMonthsGrid({ columns: 4, format: 'short' }).map((months, i) => (
                                                            // eslint-disable-next-line react/no-array-index-key
                                                            <DatePicker.TableRow key={i}>
                                                                {
                                                                    months.map((month) => (
                                                                        <DatePicker.TableCell
                                                                            key={month.value}
                                                                            value={month.value}
                                                                        >
                                                                            <DatePicker.TableCellTrigger>
                                                                                {month.label}
                                                                            </DatePicker.TableCellTrigger>
                                                                        </DatePicker.TableCell>
                                                                    ))
                                                                }
                                                            </DatePicker.TableRow>
                                                        ))
                                                    }
                                                </DatePicker.TableBody>
                                            </DatePicker.Table>
                                        </>
                                    )
                                }
                            </DatePicker.Context>
                        </DatePicker.View>
                        <DatePicker.View view="year">
                            <DatePicker.Context>
                                {
                                    (api) => (
                                        <>
                                            <DatePicker.ViewControl>
                                                <DatePicker.PrevTrigger>
                                                    <BsChevronLeft />
                                                </DatePicker.PrevTrigger>
                                                <DatePicker.ViewTrigger>
                                                    <DatePicker.RangeText />
                                                </DatePicker.ViewTrigger>
                                                <DatePicker.NextTrigger>
                                                    <BsChevronRight />
                                                </DatePicker.NextTrigger>
                                            </DatePicker.ViewControl>
                                            <DatePicker.Table>
                                                <DatePicker.TableBody>
                                                    {
                                                        api.getYearsGrid({ columns: 4 }).map((years, i) => (
                                                            // eslint-disable-next-line react/no-array-index-key
                                                            <DatePicker.TableRow key={i}>
                                                                {
                                                                    years.map((year) => (
                                                                        <DatePicker.TableCell
                                                                            key={year.value}
                                                                            value={year.value}
                                                                        >
                                                                            <DatePicker.TableCellTrigger>
                                                                                {year.label}
                                                                            </DatePicker.TableCellTrigger>
                                                                        </DatePicker.TableCell>
                                                                    ))
                                                                }
                                                            </DatePicker.TableRow>
                                                        ))
                                                    }
                                                </DatePicker.TableBody>
                                            </DatePicker.Table>
                                        </>
                                    )
                                }
                            </DatePicker.Context>
                        </DatePicker.View>
                    </DatePicker.Content>
                </DatePicker.Positioner>
            </Portal>
        </DatePicker.Root>
    );
}

AppDatePicker.defaultProps = {
    value: undefined,
    minDate: undefined,
    maxDate: undefined,
    required: false,
    name: undefined,
    clearable: false,
};
