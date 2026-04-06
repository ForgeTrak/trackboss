import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddFamilyModal from '../../../components/modals/AddFamilyModal';
import * as memberController from '../../../controller/member';

// Mock the dependencies
vi.mock('../../../controller/member');
vi.mock('react-date-picker', () => ({
    default: ({ onChange, value }: any) => (
        <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(new Date(e.target.value))}
            data-testid="date-picker"
        />
    ),
}));
vi.mock('react-select', () => ({
    default: ({ onChange, options }: any) => (
        <select onChange={(e) => onChange(options.find((opt: any) => opt.value === e.target.value))} data-testid="select">
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    ),
}));
vi.mock('../../../components/input/WrappedSwitchInput', () => ({
    default: ({ label, checked, onChange }: any) => (
        <div>
            <span>{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                data-testid={`switch-${label}`}
            />
        </div>
    ),
}));

const mockMembershipAdmin = {
    membershipId: 1,
    uuid: 'test-uuid',
    tenantId: 'tenant',
    memberId: 1,
    membershipAdmin: 'Admin',
    membershipAdminId: 1,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '1234567890',
    address: '123 Admin St',
    city: 'Admin City',
    state: 'AS',
    zip: '12345',
    country: 'US',
    timezone: 'America/New_York',
    createdAt: new Date(),
    updatedAt: new Date(),
    active: true,
    memberTypeId: 1,
    memberType: 'Admin',
    membershipType: 'Family',
    membershipTypeId: 1,
    occupation: 'Administrator',
    birthdate: new Date(),
    emergencyContact: 'Emergency Contact',
    emergencyPhone: '9876543210',
    emergencyRelationship: 'Spouse',
    medicalNotes: 'No medical conditions',
    waiverSigned: true,
    waiverDate: new Date(),
} as any;

describe('AddFamilyModal', () => {
    const mockOnClose = vi.fn();
    const mockRefreshList = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(memberController.createMember).mockResolvedValue(undefined);
        vi.mocked(memberController.getMemberByEmail).mockResolvedValue(null);
    });

    it('renders when isOpen is true', () => {
        render(
            <AddFamilyModal
                isOpen
                membershipAdmin={mockMembershipAdmin}
                token="test-token"
                onClose={mockOnClose}
                refreshList={mockRefreshList}
            />,
        );

        expect(screen.getByText('Add family member')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(
            <AddFamilyModal
                isOpen={false}
                membershipAdmin={mockMembershipAdmin}
                token="test-token"
                onClose={mockOnClose}
                refreshList={mockRefreshList}
            />,
        );

        expect(screen.queryByText('Add a Family Member')).not.toBeInTheDocument();
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('calls onClose when Cancel button is clicked', () => {
        render(
            <AddFamilyModal
                isOpen
                membershipAdmin={mockMembershipAdmin}
                token="test-token"
                onClose={mockOnClose}
                refreshList={mockRefreshList}
            />,
        );

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders form fields', () => {
        render(
            <AddFamilyModal
                isOpen
                membershipAdmin={mockMembershipAdmin}
                token="test-token"
                onClose={mockOnClose}
                refreshList={mockRefreshList}
            />,
        );

        expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
        expect(screen.getByText('Phone')).toBeInTheDocument();
        expect(screen.getByTestId('date-picker')).toBeInTheDocument();
        expect(screen.getByTestId('select')).toBeInTheDocument();
    });

    it('allows filling in form fields', () => {
        render(
            <AddFamilyModal
                isOpen
                membershipAdmin={mockMembershipAdmin}
                token="test-token"
                onClose={mockOnClose}
                refreshList={mockRefreshList}
            />,
        );

        const firstNameInput = screen.getByPlaceholderText('First Name');
        fireEvent.change(firstNameInput, { target: { value: 'John' } });

        expect(firstNameInput).toHaveValue('John');
    });

    it('shows Save button in footer', () => {
        render(
            <AddFamilyModal
                isOpen
                membershipAdmin={mockMembershipAdmin}
                token="test-token"
                onClose={mockOnClose}
                refreshList={mockRefreshList}
            />,
        );

        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
});
