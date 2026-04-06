import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NameAddressDisplay from '../../../components/shared/NameAddressDisplay';

const mockAddressContainer = {
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'Anytown',
    state: 'ST',
    zip: '12345',
    phone: '555-123-4567',
    email: 'john.doe@example.com',
    birthDate: '1990-01-15',
};

describe('NameAddressDisplay', () => {
    it('renders name correctly', () => {
        render(<NameAddressDisplay addressContainer={mockAddressContainer} />);

        expect(screen.getByText((content) => content.includes('John'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Doe'))).toBeInTheDocument();
    });

    it('renders address correctly', () => {
        render(<NameAddressDisplay addressContainer={mockAddressContainer} />);

        expect(screen.getByText('123 Main St')).toBeInTheDocument();
        // Address components are often split, so we check for the container
        expect(screen.getByText((content) => content.includes('Anytown'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('ST'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('12345'))).toBeInTheDocument();
    });

    it('renders phone as external link', () => {
        render(<NameAddressDisplay addressContainer={mockAddressContainer} />);

        const phoneLink = screen.getByText('555-123-4567');
        expect(phoneLink).toBeInTheDocument();
        expect(phoneLink).toHaveAttribute('href', 'tel:555-123-4567');
        expect(phoneLink).toHaveAttribute('target', '_blank');
    });

    it('renders email as external link', () => {
        render(<NameAddressDisplay addressContainer={mockAddressContainer} />);

        const emailLink = screen.getByText('john.doe@example.com');
        expect(emailLink).toBeInTheDocument();
        expect(emailLink).toHaveAttribute('href', 'mailto:john.doe@example.com');
        expect(emailLink).toHaveAttribute('target', '_blank');
    });

    it('renders birth date and age correctly', () => {
        render(<NameAddressDisplay addressContainer={mockAddressContainer} />);

        // Use flexible text matching for DOB which is split across elements
        expect(screen.getByText((content) => content.includes('DOB:'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('01-15-1990'))).toBeInTheDocument();
        expect(screen.getByText(/\(\d+\)/)).toBeInTheDocument();
    });

    it('handles missing data gracefully', () => {
        const incompleteData = {
            firstName: 'Jane',
            lastName: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            phone: '',
            email: '',
            birthDate: '',
        };

        render(<NameAddressDisplay addressContainer={incompleteData} />);

        expect(screen.getByText('Jane')).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('DOB:'))).toBeInTheDocument();
    });

    it('displays age calculation', () => {
        render(<NameAddressDisplay addressContainer={mockAddressContainer} />);

        const ageText = screen.getByText(/\(\d+\)/);
        expect(ageText).toBeInTheDocument();
        // Age should be reasonable (not negative or extremely large)
        const ageMatch = ageText.textContent?.match(/\((\d+)\)/);
        if (ageMatch) {
            const age = parseInt(ageMatch[1], 10);
            expect(age).toBeGreaterThan(0);
            expect(age).toBeLessThan(150);
        }
    });

    it('handles different birth date formats', () => {
        const differentDateData = {
            ...mockAddressContainer,
            birthDate: '1985-12-25',
        };

        render(<NameAddressDisplay addressContainer={differentDateData} />);

        expect(screen.getByText((content) => content.includes('12-25-1985'))).toBeInTheDocument();
        expect(screen.getByText(/\(\d+\)/)).toBeInTheDocument();
    });
});
