import React from 'react';
import { Stack, Input } from '@chakra-ui/react';
import AppDatePicker from './AppDatePicker';

interface AppDateTimePickerProps {
    value?: Date,
    // eslint-disable-next-line no-unused-vars
    onChange: (date?: Date) => void,
    minDate?: Date,
    maxDate?: Date,
    required?: boolean,
}

function isValidDate(date?: Date): date is Date {
    return date instanceof Date && !Number.isNaN(date.getTime());
}

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}

function toTimeString(date?: Date): string {
    if (!isValidDate(date)) {
        return '';
    }
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AppDateTimePicker(props: AppDateTimePickerProps) {
    const { value, onChange, minDate, maxDate, required } = props;

    const handleDateChange = (date?: Date) => {
        if (!date) {
            onChange(undefined);
            return;
        }
        const merged = new Date(date);
        if (isValidDate(value)) {
            merged.setHours(value.getHours(), value.getMinutes(), 0, 0);
        } else {
            merged.setHours(0, 0, 0, 0);
        }
        onChange(merged);
    };

    const handleTimeChange = (time: string) => {
        const [hours, minutes] = time.split(':').map((part) => parseInt(part, 10));
        const base = isValidDate(value) ? new Date(value) : new Date();
        base.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
        onChange(base);
    };

    return (
        <Stack direction="column" align="stretch" gap={2} width="full" minW={0}>
            <AppDatePicker
                value={value}
                onChange={handleDateChange}
                minDate={minDate}
                maxDate={maxDate}
                required={required}
            />
            <Input
                type="time"
                width="full"
                colorPalette="orange"
                value={toTimeString(value)}
                onChange={(e) => handleTimeChange(e.target.value)}
            />
        </Stack>
    );
}

AppDateTimePicker.defaultProps = {
    value: undefined,
    minDate: undefined,
    maxDate: undefined,
    required: false,
};
