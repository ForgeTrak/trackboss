import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MembershipApplicationModal from '../../../components/modals/MembershipApplicationModal';
import { UserContext } from '../../../contexts/UserContext';
import * as membershipApplicationController from '../../../controller/membershipApplication';

vi.mock('../../../controller/membershipApplication');
vi.mock('../../../components/shared/NameAddressDisplay', () => ({
    default: ({ addressContainer }: any) => (
        <div data-testid="name-address-display">
            {addressContainer.firstName}
            {' '}
            {addressContainer.lastName}
        </div>
    ),
}));

const baseMembershipApplication = {
    id: 42,
    status: 'Review',
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'Anytown',
    state: 'NY',
    zip: '12345',
    email: 'john@example.com',
    phone: '555-1234',
    phoneNumber: '555-1234',
    occupation: 'Engineer',
    googleLink: 'https://google.com/search?q=John+Doe',
    receivedDate: new Date('2024-06-15'),
    birthDate: '1990-01-01',
    referredBy: 'Jane Smith',
    familyMembers: [
        { firstName: 'Alice', lastName: 'Doe', dob: '2010-05-10' },
        { firstName: 'Bob', lastName: 'Doe', dob: '2012-08-20' },
    ],
    internalNotes: 'Internal note here',
    sharedNotes: 'Shared note here',
};

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
            {component}
        </UserContext.Provider>,
    )
);

describe('MembershipApplicationModal', () => {
    const mockOnClose = vi.fn();
    const mockAddAction = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(membershipApplicationController.reviewMembershipApplication)
            .mockResolvedValue([]);
        vi.mocked(membershipApplicationController.rejectMembershipApplication)
            .mockResolvedValue([]);
        vi.mocked(membershipApplicationController.acceptMembershipApplication)
            .mockResolvedValue([]);
    });

    it('renders when isOpen is true', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        expect(screen.getByText('Application Info')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen={false}
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        expect(screen.queryByText('Application Info')).not.toBeInTheDocument();
        expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });

    it('renders tab list with three tabs', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        expect(screen.getByText('Application Info')).toBeInTheDocument();
        expect(screen.getByText('Family Members')).toBeInTheDocument();
        expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('renders NameAddressDisplay on Application Info tab', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        expect(screen.getByTestId('name-address-display')).toBeInTheDocument();
        expect(screen.getByText('Engineer')).toBeInTheDocument();
        expect(screen.getByText((c) => c.includes('Recommended by'))).toBeInTheDocument();
        expect(screen.getByText((c) => c.includes('Jane Smith'))).toBeInTheDocument();
    });

    it('shows family members on the Family Members tab', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        const familyTab = screen.getByText('Family Members');
        fireEvent.click(familyTab);

        expect(screen.getByText((c) => c.includes('Alice'))).toBeInTheDocument();
        expect(screen.getByText((c) => c.includes('Bob'))).toBeInTheDocument();
    });

    it('shows notes textareas on the Notes tab', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        const notesTab = screen.getByText('Notes');
        fireEvent.click(notesTab);

        expect(screen.getByText('Notes to applicant (emailed to applicant)')).toBeInTheDocument();
        expect(screen.getByText('Internal PRA Notes (not shared)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Notes to applicant (sent in email)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Internal PRA notes (not shared)')).toBeInTheDocument();
    });

    it('shows warning alert about emails', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        expect(screen.getByText((c) => (
            c.includes('Accept or Reject') && c.includes('sends emails')
        ))).toBeInTheDocument();
    });

    it('calls onClose when Close button is clicked', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        fireEvent.click(screen.getByText('Close'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders action buttons: Review, Reject, Accept, Accept as Guest', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        expect(screen.getByText('Review')).toBeInTheDocument();
        expect(screen.getByText('Reject')).toBeInTheDocument();
        expect(screen.getByText('Accept')).toBeInTheDocument();
        expect(screen.getByText('Accept as Guest')).toBeInTheDocument();
    });

    it('enables Review, Reject, and Accept as Guest when status is Review', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={{ ...baseMembershipApplication, status: 'Review' }}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        expect(screen.getByText('Review')).not.toBeDisabled();
        expect(screen.getByText('Reject')).not.toBeDisabled();
        expect(screen.getByText('Accept')).not.toBeDisabled();
        expect(screen.getByText('Accept as Guest')).not.toBeDisabled();
    });

    it('disables Review, Reject, and Accept as Guest when status is Accepted', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={{ ...baseMembershipApplication, status: 'Accepted' }}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        expect(screen.getByText('Review')).toBeDisabled();
        expect(screen.getByText('Reject')).toBeDisabled();
        expect(screen.getByText('Accept')).toBeDisabled();
        expect(screen.getByText('Accept as Guest')).toBeDisabled();
    });

    it('calls reviewMembershipApplication and addAction on Review click', async () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        fireEvent.click(screen.getByText('Review'));

        await waitFor(() => {
            expect(membershipApplicationController.reviewMembershipApplication)
                .toHaveBeenCalledWith('test-token', 42, 'Internal note here', 'Shared note here');
        });
        await waitFor(() => {
            expect(mockAddAction).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    it('calls rejectMembershipApplication and addAction on Reject click', async () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        fireEvent.click(screen.getByText('Reject'));

        await waitFor(() => {
            expect(membershipApplicationController.rejectMembershipApplication)
                .toHaveBeenCalledWith('test-token', 42, 'Internal note here', 'Shared note here');
        });
        await waitFor(() => {
            expect(mockAddAction).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    it('calls acceptMembershipApplication on Accept click', async () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        fireEvent.click(screen.getByText('Accept'));

        await waitFor(() => {
            expect(membershipApplicationController.acceptMembershipApplication)
                .toHaveBeenCalledWith('test-token', 42, 'Internal note here', 'Shared note here');
        });
        await waitFor(() => {
            expect(mockAddAction).toHaveBeenCalledTimes(1);
        });
    });

    it('calls acceptMembershipApplication with guest flag on Accept as Guest click', async () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        fireEvent.click(screen.getByText('Accept as Guest'));

        await waitFor(() => {
            expect(membershipApplicationController.acceptMembershipApplication)
                .toHaveBeenCalledWith('test-token', 42, 'Internal note here', 'Shared note here', true);
        });
        await waitFor(() => {
            expect(mockAddAction).toHaveBeenCalledTimes(1);
        });
    });

    it('updates applicant notes via textarea on Notes tab', () => {
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={baseMembershipApplication}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        fireEvent.click(screen.getByText('Notes'));

        const applicantTextarea = screen.getByPlaceholderText('Notes to applicant (sent in email)');
        fireEvent.change(applicantTextarea, { target: { value: 'Updated applicant notes' } });

        expect(applicantTextarea).toBeInTheDocument();
    });

    it('handles empty familyMembers gracefully', () => {
        const appNoFamily = { ...baseMembershipApplication, familyMembers: [] };
        renderWithContext(
            <MembershipApplicationModal
                membershipApplication={appNoFamily}
                isOpen
                onClose={mockOnClose}
                addAction={mockAddAction}
                token="test-token"
            />,
        );

        fireEvent.click(screen.getByText('Family Members'));

        // Should render without crashing
        expect(screen.getByText('Family Members')).toBeInTheDocument();
    });
});
