import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AppProvider from '../../../components/AppProvider';
import DaysOfWeekSelect from '../../../components/input/DaysOfWeekSelect';

function renderWithProviders(ui: React.ReactElement) {
    return render(<AppProvider>{ui}</AppProvider>);
}

describe('DaysOfWeekSelect', () => {
    it('lists all weekdays and calls onDayChange with the selected index', async () => {
        const user = userEvent.setup();
        const onDayChange = vi.fn();

        renderWithProviders(
            <DaysOfWeekSelect defaultDay={0} onDayChange={onDayChange} />,
        );

        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();

        await user.selectOptions(select, '3');
        expect(onDayChange).toHaveBeenCalledWith(3);
    });
});
