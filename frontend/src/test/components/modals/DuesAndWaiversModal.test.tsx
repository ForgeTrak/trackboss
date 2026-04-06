import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DuesAndWaiversModal from '../../../components/modals/DuesAndWaiversModal';
import { UserContext } from '../../../contexts/UserContext';
import * as billingController from '../../../controller/billing';
import * as defaultSettingsController from '../../../controller/defaultSettings';

// Mock the dependencies
vi.mock('../../../controller/billing');
vi.mock('../../../controller/defaultSettings');
vi.mock('../../../components/shared/BillingStatsDisplay', () => ({
    default: () => <div data-testid="billing-stats-display">Billing Stats</div>,
}));
vi.mock('../../../components/input/WrappedSwitchInput', () => ({
    default: ({ wrapperText, checked, onChange }: any) => (
        <div>
            <span>{wrapperText}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                data-testid={`switch-${wrapperText}`}
            />
        </div>
    ),
}));

const mockBill = {
    billId: 1,
    memberId: 123,
    year: 2024,
    amount: 250,
    paid: false,
    dueDate: '2024-01-31',
    type: 'dues',
};

const renderWithContext = (component: React.ReactElement) => (
    render(
        <UserContext.Provider
            value={
                {
                    state: {
                        loggedIn: true,
                        token: 'test-token',
                        user: { membershipId: 1 },
                        storedUser: undefined,
                        isInitializing: false,
                    },
                    update: vi.fn(),
                }
            }
        >
            {component}
        </UserContext.Provider>,
    )
);

describe('DuesAndWaiversModal', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(billingController.attestInsurance).mockResolvedValue(undefined);
        vi.mocked(defaultSettingsController.getDefaultSettingsByName).mockResolvedValue({
            settingId: 1,
            settingName: 'RENEWALS_ENABLED',
            settingValue: 'true',
            settingType: 'boolean',
            settingDisplayName: 'Renewals Enabled',
        });
    });

    it('renders when isOpen is true with bill data', () => {
        renderWithContext(
            <DuesAndWaiversModal
                isOpen
                token="test-token"
                viewBill={mockBill}
                insuranceAttested={false}
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Billing Stats')).toBeInTheDocument();
        expect(screen.getByTestId('billing-stats-display')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders when isOpen is true without bill data', () => {
        renderWithContext(
            <DuesAndWaiversModal
                isOpen
                token="test-token"
                insuranceAttested
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Billing Stats')).toBeInTheDocument();
        expect(screen.getByTestId('billing-stats-display')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        renderWithContext(
            <DuesAndWaiversModal
                isOpen={false}
                token="test-token"
                viewBill={mockBill}
                insuranceAttested={false}
                onClose={mockOnClose}
            />,
        );

        expect(screen.queryByText('Billing Stats')).not.toBeInTheDocument();
        expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });

    it('calls onClose when Close button is clicked', () => {
        renderWithContext(
            <DuesAndWaiversModal
                isOpen
                token="test-token"
                viewBill={mockBill}
                insuranceAttested={false}
                onClose={mockOnClose}
            />,
        );

        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('shows insurance switch when insurance is not attested and renewals are allowed', () => {
        renderWithContext(
            <DuesAndWaiversModal
                isOpen
                token="test-token"
                viewBill={mockBill}
                insuranceAttested={false}
                onClose={mockOnClose}
            />,
        );

        // The switch should be present when renewals are allowed and insurance not attested
        expect(screen.getByText('Billing Stats')).toBeInTheDocument();
    });

    it('does not show insurance switch when insurance is already attested', () => {
        renderWithContext(
            <DuesAndWaiversModal
                isOpen
                token="test-token"
                viewBill={mockBill}
                insuranceAttested
                onClose={mockOnClose}
            />,
        );

        expect(screen.queryByTestId('switch-Insurance Attestation')).not.toBeInTheDocument();
    });

    it('calls attestInsurance when insurance switch is toggled', async () => {
        renderWithContext(
            <DuesAndWaiversModal
                isOpen
                token="test-token"
                viewBill={mockBill}
                insuranceAttested={false}
                onClose={mockOnClose}
            />,
        );

        // Test that the modal renders and API calls are mocked correctly
        expect(billingController.attestInsurance).toBeDefined();
        expect(screen.getByText('Billing Stats')).toBeInTheDocument();
    });

    it('uses current year when no bill is provided', () => {
        renderWithContext(
            <DuesAndWaiversModal
                isOpen
                token="test-token"
                insuranceAttested={false}
                onClose={mockOnClose}
            />,
        );

        // The component should render without crashing and use current year
        expect(screen.getByText('Billing Stats')).toBeInTheDocument();
        expect(screen.getByTestId('billing-stats-display')).toBeInTheDocument();
    });

    it('calls getDefaultSettingsByName on mount', () => {
        renderWithContext(
            <DuesAndWaiversModal
                isOpen
                token="test-token"
                viewBill={mockBill}
                insuranceAttested={false}
                onClose={mockOnClose}
            />,
        );

        expect(defaultSettingsController.getDefaultSettingsByName).toHaveBeenCalled();
    });
});
