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

describe('DuesAndWaiversList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(billingController.getBills).mockResolvedValue([]);
        vi.mocked(billingUtil.calculateBillingYear).mockReturnValue(2024);
        vi.mocked(billingUtil.getYearsForBillingDisplay).mockImplementation((setInitialYear, setYearsList) => {
            setInitialYear(2024);
            setYearsList([2022, 2023, 2024]);
        });
    });

    it('renders the component correctly', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(screen.getByText((content) => content.includes('Hide members paying $0'))).toBeInTheDocument();
        });
    });

    it('loads bills on mount', async () => {
        renderWithContext(<DuesAndWaiversList />);

        await waitFor(() => {
            expect(billingController.getBills).toHaveBeenCalled();
        });
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
