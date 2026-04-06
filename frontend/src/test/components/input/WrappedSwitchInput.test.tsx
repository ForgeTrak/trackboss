import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AppProvider from '../../../components/AppProvider';
import WrappedSwitchInput from '../../../components/input/WrappedSwitchInput';

const toastSuccess = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useAppToast', () => ({
    useAppToast: () => ({
        success: toastSuccess,
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    }),
}));

function renderWithProviders(ui: React.ReactElement) {
    return render(<AppProvider>{ui}</AppProvider>);
}

describe('WrappedSwitchInput', () => {
    it('renders the label and reports switch changes', async () => {
        const user = userEvent.setup();
        const onSwitchChange = vi.fn();
        toastSuccess.mockClear();

        renderWithProviders(
            <WrappedSwitchInput
                wrapperText="Enable feature"
                defaultChecked={false}
                onSwitchChange={onSwitchChange}
                maxWidth={200}
            />,
        );

        expect(screen.getByText('Enable feature')).toBeInTheDocument();

        await user.click(screen.getByRole('checkbox'));
        expect(onSwitchChange).toHaveBeenCalledWith(true);
        expect(toastSuccess).not.toHaveBeenCalled();
    });

    it('shows a success toast when toastMessage is set', async () => {
        const user = userEvent.setup();
        toastSuccess.mockClear();

        renderWithProviders(
            <WrappedSwitchInput
                wrapperText="With toast"
                defaultChecked={false}
                onSwitchChange={vi.fn()}
                maxWidth={200}
                toastMessage="Saved"
                duration={3000}
            />,
        );

        await user.click(screen.getByRole('checkbox'));
        expect(toastSuccess).toHaveBeenCalledWith({
            description: 'Saved',
            duration: 3000,
        });
    });

    it('disables the switch when locked', () => {
        renderWithProviders(
            <WrappedSwitchInput
                wrapperText="Locked"
                defaultChecked
                onSwitchChange={vi.fn()}
                maxWidth={200}
                locked
            />,
        );

        expect(screen.getByRole('checkbox')).toBeDisabled();
    });
});
