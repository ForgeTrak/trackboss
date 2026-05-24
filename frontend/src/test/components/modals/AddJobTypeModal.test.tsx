import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddJobTypeModal from '../../../components/modals/AddJobTypeModal';
import { UserContext } from '../../../contexts/UserContext';

const renderWithContext = (component: React.ReactElement) => (
    render(
        <UserContext.Provider
            value={
                {
                    state: {
                        loggedIn: true,
                        token: 'test-token',
                        user: {
                            membershipId: 1,
                            tenantId: 'tenant',
                            memberId: 1,
                            membershipAdmin: 'Chippah',
                            membershipAdminId: 1,
                            firstName: 'Test',
                            lastName: 'User',
                            email: 'test@example.com',
                            phone: '1234567890',
                            address: '123 Test St',
                            city: 'Test City',
                            state: 'TS',
                            zip: '12345',
                            country: 'US',
                            timezone: 'America/New_York',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
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

describe('AddJobTypeModal', () => {
    const mockOnClose = vi.fn();
    const mockAddAction = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders when isOpen is true', () => {
        renderWithContext(
            <AddJobTypeModal
                eventType="Work Day"
                eventTypeId={1}
                isOpen
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        const matcher = (content: string) => (
            content.includes('Add a') && content.includes('Work Day') && content.includes('job')
        );
        expect(screen.getByText(matcher)).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        renderWithContext(
            <AddJobTypeModal
                eventType="Work Day"
                eventTypeId={1}
                isOpen={false}
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        expect(screen.queryByText((content) =>
            // eslint-disable-next-line implicit-arrow-linebreak
            content.includes('Add a') && content.includes('Work Day') && content.includes('job'))).not.toBeInTheDocument();
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('calls onClose when Close button is clicked', () => {
        renderWithContext(
            <AddJobTypeModal
                eventType="Work Day"
                eventTypeId={1}
                isOpen
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders form fields', () => {
        renderWithContext(
            <AddJobTypeModal
                eventType="Work Day"
                eventTypeId={1}
                isOpen
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Point Value')).toBeInTheDocument();
        expect(screen.getByText('Cash Payout')).toBeInTheDocument();
        expect(screen.getByText('Job Day')).toBeInTheDocument();
        expect(screen.getByText('Positions')).toBeInTheDocument();
        expect(screen.getByText('Display Order')).toBeInTheDocument();
    });

    it('renders input elements', () => {
        renderWithContext(
            <AddJobTypeModal
                eventType="Work Day"
                eventTypeId={1}
                isOpen
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        // Should have various input elements
        const inputs = screen.getAllByRole('textbox');
        const selects = screen.getAllByRole('combobox');
        expect(inputs.length + selects.length).toBeGreaterThan(0);
    });

    it('shows Save button in footer', () => {
        renderWithContext(
            <AddJobTypeModal
                eventType="Work Day"
                eventTypeId={1}
                isOpen
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
});
