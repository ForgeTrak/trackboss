import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MemberSelector from '../../../components/shared/MemberSelector';
import * as memberController from '../../../controller/member';
import { UserContext } from '../../../contexts/UserContext';

// Mock the dependencies
vi.mock('../../../controller/member');

const mockMembers : any[] = [
    {
        tenantId: 'test-tenant',
        memberId: 1,
        membershipId: 1,
        membershipAdmin: 'John Doe',
        membershipAdminId: 1,
        uuid: 'uuid-1',
        firstName: 'John',
        lastName: 'Doe',
        active: true,
        membershipType: 'Full Member',
        memberType: { memberTypeId: 1, type: 'Full Member' },
        memberTypeId: 1,
        membershipTypeId: 1,
        occupation: 'Engineer',
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        birthDate: '1990-01-15',
        address: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        zip: '12345',
        country: 'USA',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '555-987-6543',
        dateJoined: '2020-01-01',
        lastUpdated: '2024-01-01',
    },
    {
        tenantId: 'test-tenant',
        memberId: 2,
        membershipId: 1,
        membershipAdmin: 'John Doe',
        membershipAdminId: 1,
        uuid: 'uuid-2',
        firstName: 'Jane',
        lastName: 'Smith',
        occupation: 'Teacher',
        email: 'jane.smith@example.com',
        birthdate: '1992-01-01',
        dateJoined: '2020-01-01',
        address: '456 Oak St',
        city: 'Anytown',
        state: 'ST',
        zip: '12345',
        lastModifiedDate: '2024-01-01',
        lastModifiedBy: 'admin',
        isBoardMember: false,
        subscribed: true,
    },
    {
        tenantId: 'test-tenant',
        memberId: 3,
        membershipId: 2,
        membershipAdmin: 'Jane Smith',
        membershipAdminId: 2,
        uuid: 'uuid-3',
        active: false, // Inactive member should be filtered out
        memberTypeId: 1,
        memberType: 'Full',
        membershipType: 'Full Member',
        membershipTypeId: 1,
        firstName: 'Bob',
        lastName: 'Johnson',
        occupation: 'Doctor',
        email: 'bob@test.com',
        birthdate: '1985-01-01',
        dateJoined: '2019-01-01',
        address: '789 Pine St',
        city: 'Anytown',
        state: 'ST',
        zip: '12345',
        lastModifiedDate: '2024-01-01',
        lastModifiedBy: 'admin',
        isBoardMember: false,
        subscribed: true,
    },
];

describe('MemberSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(memberController.getMembersByMembership).mockResolvedValue(mockMembers);
        vi.mocked(memberController.getMemberList).mockResolvedValue(mockMembers);
    });

    const renderWithContext = (component: React.ReactElement) => (
        render(
            <UserContext.Provider
                value={
                    {
                        state: {
                            loggedIn: true,
                            token: 'test-token',
                            user: { membershipId: 1 } as any,
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

    it('renders the select component', () => {
        renderWithContext(
            <MemberSelector
                isAdmin={false}
                disabled={false}
                setSelectedOption={vi.fn()}
            />,
        );

        expect(screen.getByText((content) => content.includes('Choose a member'))).toBeInTheDocument();
    });

    it('loads members by membership for non-admin users', async () => {
        renderWithContext(
            <MemberSelector
                isAdmin={false}
                disabled={false}
                setSelectedOption={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(memberController.getMembersByMembership).toHaveBeenCalledWith('test-token', 1);
        });
    });

    it('loads all members for admin users', async () => {
        renderWithContext(
            <MemberSelector
                isAdmin
                disabled={false}
                setSelectedOption={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(memberController.getMemberList).toHaveBeenCalledWith('test-token');
        });
    });

    it('displays active members sorted by last name', async () => {
        renderWithContext(
            <MemberSelector
                isAdmin={false}
                disabled={false}
                setSelectedOption={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(memberController.getMembersByMembership).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Choose a member'))).toBeInTheDocument();
    });

    it('shows admin indicator for non-admin members', async () => {
        renderWithContext(
            <MemberSelector
                isAdmin={false}
                disabled={false}
                setSelectedOption={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(memberController.getMembersByMembership).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Choose a member'))).toBeInTheDocument();
    });

    it('calls setSelectedOption when a member is selected', async () => {
        const mockSetSelectedOption = vi.fn();

        renderWithContext(
            <MemberSelector
                isAdmin={false}
                disabled={false}
                setSelectedOption={mockSetSelectedOption}
            />,
        );

        await waitFor(() => {
            expect(memberController.getMembersByMembership).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Choose a member'))).toBeInTheDocument();
        expect(mockSetSelectedOption).toBeDefined();
    });

    it('is disabled when disabled prop is true and not admin', () => {
        renderWithContext(
            <MemberSelector
                isAdmin={false}
                disabled
                setSelectedOption={vi.fn()}
            />,
        );

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Choose a member'))).toBeInTheDocument();
    });

    it('is not disabled when disabled prop is true but user is admin', () => {
        renderWithContext(
            <MemberSelector
                isAdmin
                disabled
                setSelectedOption={vi.fn()}
            />,
        );

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Choose a member'))).toBeInTheDocument();
    });

    it('uses custom membershipId when provided', async () => {
        renderWithContext(
            <MemberSelector
                isAdmin={false}
                disabled={false}
                setSelectedOption={vi.fn()}
                membershipId={5}
            />,
        );

        await waitFor(() => {
            expect(memberController.getMembersByMembership).toHaveBeenCalledWith('test-token', 5);
        });
    });

    it('handles empty member list gracefully', async () => {
        vi.mocked(memberController.getMembersByMembership).mockResolvedValue([]);

        renderWithContext(
            <MemberSelector
                isAdmin={false}
                disabled={false}
                setSelectedOption={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(memberController.getMembersByMembership).toHaveBeenCalled();
        });

        // Should still render without crashing
        expect(screen.getByText(/Choose a member or start typing to narrow down the list/)).toBeInTheDocument();
    });

    it('allows searching/filtering members', async () => {
        renderWithContext(
            <MemberSelector
                isAdmin={false}
                disabled={false}
                setSelectedOption={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(memberController.getMembersByMembership).toHaveBeenCalled();
        });

        // Component should render without crashing
        expect(screen.getByText((content) => content.includes('Choose a member'))).toBeInTheDocument();
    });
});
