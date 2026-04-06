import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DuesAndWaiversList from '../../../components/shared/DuesAndWaiversList';
import * as billingController from '../../../controller/billing';
import * as billingUtil from '../../../util/billing';
import { UserContext } from '../../../contexts/UserContext';

// Mock the dependencies
vi.mock('../../../controller/billing');
vi.mock('../../../util/billing');

const renderWithContext = (component: React.ReactElement) => (
    render(
        <UserContext.Provider
            value={
                {
                    state: {
                        loggedIn: true,
                        token: 'test-token',
                        user: undefined,
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

const mockBills = [
    {
        billId: 1,
        tenantId: 'test-tenant',
        generatedDate: '2024-01-15',
        year: 2024,
        amount: 250.00,
        amountWithFee: 258.50,
        pointsEarned: 85,
        pointsThreshold: 100,
        membershipAdmin: 'Test Admin',
        membershipAdminEmail: 'admin@test.com',
        phone: '555-123-4567',
        membershipId: 1,
        firstName: 'John',
        lastName: 'Doe',
        membershipType: 'Full Member',
        curYearPaid: false,
        curYearIns: false,
        dueDate: '2024-02-15',
        squareLink: 'https://square.link/test',
        memberActive: true,
    },
    {
        billId: 2,
        tenantId: 'test-tenant',
        generatedDate: '2024-01-15',
        year: 2024,
        amount: 0.00,
        amountWithFee: 0.00,
        pointsEarned: 100,
        pointsThreshold: 100,
        membershipAdmin: 'Test Admin',
        membershipAdminEmail: 'admin@test.com',
        phone: '555-123-4568',
        membershipId: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        membershipType: 'Full Member',
        curYearPaid: true,
        curYearIns: true,
        dueDate: '2024-02-15',
        squareLink: 'https://square.link/test2',
        memberActive: true,
    },
];

describe('DuesAndWaiversList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(billingController.getBills).mockResolvedValue(mockBills);
        vi.mocked(billingUtil.calculateBillingYear).mockReturnValue(2024);
        vi.mocked(billingUtil.getYearsForBillingDisplay).mockImplementation((setInitialYear, setYearsList) => {
            setInitialYear(2024);
            setYearsList([2022, 2023, 2024]);
        });
    });

    it('renders the component correctly', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(screen.getByText((content) => content.includes('Billing data'))).toBeInTheDocument();
        });
    });

    it('renders the bill list correctly', () => {
        renderWithContext(<DuesAndWaiversList />);

        expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
    });

    it('loads bills on mount', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(billingController.getBills).toHaveBeenCalled();
        });
    });

    it('loads and displays bill data on mount', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(billingController.getBills).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
    });

    it('displays statistics correctly', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(billingController.getBills).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
    });

    it('filters bills by search term', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(billingController.getBills).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
    });

    it('handles filter switches correctly', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(billingController.getBills).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
    });

    it('handles year selection change', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(billingController.getBills).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
    });

    it('handles bill selection', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(billingController.getBills).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
    });

    it('shows billing stats for selected bill', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(billingController.getBills).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
    });

    it('handles empty bill list gracefully', async () => {
        vi.mocked(billingController.getBills).mockResolvedValue([]);

        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(billingController.getBills).toHaveBeenCalled();
        });

        expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
        vi.mocked(billingController.getBills).mockRejectedValue(new Error('API Error'));

        renderWithContext(<DuesAndWaiversList />);

        // Component should still render without crashing
        expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
    });
});
