import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BillingStatsDisplay from '../../../components/shared/BillingStatsDisplay';

const mockBill = {
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
};

describe('BillingStatsDisplay', () => {
    it('renders correctly with bill data', () => {
        render(<BillingStatsDisplay bill={mockBill} />);

        expect(screen.getByText('Full Member')).toBeInTheDocument();
        const isDt = (el: Element | null) => el?.tagName.toLowerCase() === 'dt';
        const isDd = (el: Element | null) => el?.tagName.toLowerCase() === 'dd';
        expect(screen.getByText(
            (content, element) => content.includes('Points Earned in') && isDt(element),
        )).toBeInTheDocument();
        expect(screen.getByText(
            (content, element) => content.includes('2024') && isDt(element),
        )).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
        expect(screen.getByText(
            (content, element) => content.includes('of') && isDd(element),
        )).toBeInTheDocument();
        expect(screen.getByText(
            (content, element) => content.includes('100') && isDd(element),
        )).toBeInTheDocument();
        expect(screen.getByText('Amount Due')).toBeInTheDocument();
        expect(screen.getByText('$250')).toBeInTheDocument();
        expect(screen.getByText('$258.5 w/ Square')).toBeInTheDocument();
        expect(screen.getByText('Bill generated on')).toBeInTheDocument();
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
        expect(screen.getByText('Square link')).toBeInTheDocument();
    });

    it('renders without bill data (undefined)', () => {
        render(<BillingStatsDisplay />);

        expect(screen.getByText('Points Earned in')).toBeInTheDocument();
        expect(screen.getByText('Amount Due')).toBeInTheDocument();
        expect(screen.getByText('Bill generated on')).toBeInTheDocument();
    });

    it('renders with empty bill object', () => {
        const emptyBill = {
            billId: 1,
            tenantId: 'test-tenant',
            generatedDate: '2024-01-15',
            year: 2024,
            amount: 0,
            amountWithFee: 0,
            pointsEarned: 0,
            pointsThreshold: 0,
            membershipAdmin: '',
            membershipAdminEmail: '',
            phone: '',
            membershipId: 1,
            firstName: '',
            lastName: '',
            membershipType: '',
            curYearPaid: false,
            curYearIns: false,
            dueDate: '',
            memberActive: false,
        };
        render(<BillingStatsDisplay bill={emptyBill} />);

        expect(screen.getByText(
            (content, element) => content.includes('Points Earned in') && element?.tagName.toLowerCase() === 'dt',
        )).toBeInTheDocument();
        expect(screen.getByText('Amount Due')).toBeInTheDocument();
        expect(screen.getByText('Bill generated on')).toBeInTheDocument();
    });

    it('square link has correct attributes', () => {
        render(<BillingStatsDisplay bill={mockBill} />);

        const link = screen.getByText('Square link');
        expect(link).toHaveAttribute('href', 'https://square.link/test');
        expect(link).toHaveAttribute('target', '_blank');
    });

    it('displays monetary values correctly formatted', () => {
        render(<BillingStatsDisplay bill={mockBill} />);

        expect(screen.getByText('$250')).toBeInTheDocument();
        expect(screen.getByText('$258.5 w/ Square')).toBeInTheDocument();
    });
});
