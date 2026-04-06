import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AppProvider from '../../../../components/AppProvider';
import TrackStatusCard from '../../../../components/cards/dashboard/TrackStatusCard';

function renderWithProviders(ui: React.ReactElement) {
    return render(<AppProvider>{ui}</AppProvider>);
}

describe('TrackStatusCard', () => {
    it('renders the title and area names', () => {
        renderWithProviders(
            <TrackStatusCard
                areaStatusList={[
                    { name: 'Main Track', isOpen: true },
                    { name: 'Pee Wee', isOpen: false },
                ]}
                isAdmin={false}
                updateArea={vi.fn()}
            />,
        );

        expect(screen.getByRole('heading', { name: /track status/i })).toBeInTheDocument();
        expect(screen.getByText('Main Track')).toBeInTheDocument();
        expect(screen.getByText('Pee Wee')).toBeInTheDocument();
    });

    it('does not show toggle switches when the user is not an admin', () => {
        renderWithProviders(
            <TrackStatusCard
                areaStatusList={[{ name: 'Arena', isOpen: true }]}
                isAdmin={false}
                updateArea={vi.fn()}
            />,
        );

        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('calls updateArea with toggled open state when an admin flips a switch', async () => {
        const user = userEvent.setup();
        const updateArea = vi.fn().mockResolvedValue(undefined);
        const arena = { name: 'Arena', isOpen: true };

        renderWithProviders(
            <TrackStatusCard
                areaStatusList={[arena]}
                isAdmin
                updateArea={updateArea}
            />,
        );

        await user.click(screen.getByRole('checkbox'));

        expect(updateArea).toHaveBeenCalledTimes(1);
        expect(updateArea).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Arena', isOpen: false }),
        );
    });
});
