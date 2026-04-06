import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AppProvider from '../../../components/AppProvider';
import YearsDropDown from '../../../components/shared/YearsDropDown';

function renderWithProviders(ui: React.ReactElement) {
    return render(<AppProvider>{ui}</AppProvider>);
}

describe('YearsDropDown', () => {
    it('renders the menu trigger and shows the header with the initial year', () => {
        renderWithProviders(
            <YearsDropDown
                years={[2022, 2023, 2024]}
                header="Season"
                setYear={() => {}}
                initialYear={2023}
            />,
        );

        expect(screen.getByRole('button', { name: /past years/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Season(2023)');
    });

    it('calls setYear and updates the displayed year when a menu item is chosen', async () => {
        const user = userEvent.setup();
        const setYear = vi.fn();

        renderWithProviders(
            <YearsDropDown
                years={[2022, 2023]}
                header="Reports"
                setYear={setYear}
                initialYear={2023}
            />,
        );

        await user.click(screen.getByRole('button', { name: /past years/i }));

        const menu = await screen.findByRole('menu');
        await user.click(within(menu).getByRole('menuitem', { name: '2022' }));

        expect(setYear).toHaveBeenCalledWith(2022);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Reports(2022)');
    });
});
