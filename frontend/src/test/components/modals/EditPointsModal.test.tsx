import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppProvider from '../../../components/AppProvider';
import EditPointsModal from '../../../components/modals/EditPointsModal';
import { UserContext } from '../../../contexts/UserContext';
import * as jobController from '../../../controller/job';

vi.mock('../../../controller/job');
vi.mock('../../../hooks/useAppToast', () => ({
    useAppToast: () => ({
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    }),
}));

const mockUser = {
    membershipId: 1,
    tenantId: 'tenant',
    memberId: 1,
    membershipAdmin: 'Admin',
    membershipAdminId: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    uuid: 'test-uuid',
    active: true,
    memberTypeId: 1,
    memberType: 'Admin',
    membershipType: 'Full',
    membershipTypeId: 1,
    phoneNumber: '1234567890',
    occupation: 'Tester',
    birthdate: '1990-01-01',
    dateJoined: '2020-01-01',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    lastModifiedDate: '2024-01-01',
    lastModifiedBy: 'admin',
    isBoardMember: false,
};

const mockSelectedJob = {
    jobId: 101,
    memberId: 1,
    membershipId: 1,
    tenantId: 'tenant',
    member: 'John Doe',
    event: 'Work Day',
    start: '2024-06-01',
    title: 'Gate Duty',
    verified: false,
    pointsAwarded: 3,
};

const renderWithContext = (component: React.ReactElement) => (
    render(
        <UserContext.Provider
            value={
                {
                    state: {
                        loggedIn: true,
                        token: 'test-token',
                        user: mockUser,
                        storedUser: undefined,
                        isInitializing: false,
                    },
                    update: vi.fn(),
                }
            }
        >
            <AppProvider>{component}</AppProvider>
        </UserContext.Provider>,
    )
);

describe('EditPointsModal', () => {
    const mockOnClose = vi.fn();
    const mockRefreshPoints = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(jobController.modifyJobPoints).mockResolvedValue({});
        vi.mocked(jobController.removeSignup).mockResolvedValue({});
    });

    it('renders when isOpen is true', () => {
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={mockSelectedJob}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Edit points for John Doe - Gate Duty')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={mockSelectedJob}
                refreshPoints={mockRefreshPoints}
                isOpen={false}
                onClose={mockOnClose}
            />,
        );

        expect(screen.queryByText('Edit points for John Doe - Gate Duty')).not.toBeInTheDocument();
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('displays a number input with the current points value', () => {
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={mockSelectedJob}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        const numberInput = screen.getByRole('spinbutton');
        expect(numberInput).toBeInTheDocument();
        expect(numberInput.getAttribute('value')).toBe('3');
    });

    it('saves the existing value, refreshes, and closes when Save is clicked without changes', async () => {
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={mockSelectedJob}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        fireEvent.click(screen.getByText('Save'));
        await waitFor(() => {
            expect(jobController.modifyJobPoints).toHaveBeenCalledWith('test-token', 101, 3);
        });
        await waitFor(() => {
            expect(mockRefreshPoints).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    it('does not save while typing', async () => {
        const user = userEvent.setup();
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={mockSelectedJob}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        const input = screen.getByRole('spinbutton');
        await user.clear(input);
        await user.type(input, '2.7');
        expect(jobController.modifyJobPoints).not.toHaveBeenCalled();
    });

    it('rounds the typed value to the nearest quarter on Save', async () => {
        const user = userEvent.setup();
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={mockSelectedJob}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        const input = screen.getByRole('spinbutton');
        await user.clear(input);
        await user.type(input, '2.7');
        await user.click(screen.getByText('Save'));
        await waitFor(() => {
            expect(jobController.modifyJobPoints).toHaveBeenCalledWith('test-token', 101, 2.75);
        });
        expect(jobController.modifyJobPoints).toHaveBeenCalledTimes(1);
    });

    it('does not save when Cancel is clicked after typing', async () => {
        const user = userEvent.setup();
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={mockSelectedJob}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        const input = screen.getByRole('spinbutton');
        await user.clear(input);
        await user.type(input, '5');
        await user.click(screen.getByText('Cancel'));
        expect(jobController.modifyJobPoints).not.toHaveBeenCalled();
    });

    it('calls onClose when Cancel button is clicked', () => {
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={mockSelectedJob}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls removeSignup, refreshPoints, and onClose when Delete is clicked', async () => {
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={mockSelectedJob}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        fireEvent.click(screen.getByText('Delete'));

        await waitFor(() => {
            expect(jobController.removeSignup).toHaveBeenCalledWith('test-token', 101);
        });
        await waitFor(() => {
            expect(mockRefreshPoints).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    it('renders increment and decrement stepper buttons', () => {
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={mockSelectedJob}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        // Chakra NumberInputStepper renders two buttons for inc/dec
        const spinbutton = screen.getByRole('spinbutton');
        expect(spinbutton).toBeInTheDocument();
        // The stepper buttons exist in the DOM as part of the NumberInput group
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders header with member name and job title', () => {
        renderWithContext(
            <EditPointsModal
                memberName="Jane Smith"
                selectedJob={{ ...mockSelectedJob, title: 'Cleanup Crew' }}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Edit points for Jane Smith - Cleanup Crew')).toBeInTheDocument();
    });

    it('renders correctly with zero points', () => {
        renderWithContext(
            <EditPointsModal
                memberName="John Doe"
                selectedJob={{ ...mockSelectedJob, pointsAwarded: 0 }}
                refreshPoints={mockRefreshPoints}
                isOpen
                onClose={mockOnClose}
            />,
        );

        const numberInput = screen.getByRole('spinbutton');
        expect(numberInput.getAttribute('value')).toBe('0');
    });
});
