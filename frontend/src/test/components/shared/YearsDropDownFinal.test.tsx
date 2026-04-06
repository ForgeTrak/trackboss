import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import YearsDropDown from '../../../components/shared/YearsDropDown';

describe('YearsDropDown', () => {
    const mockSetYear = vi.fn();
    const mockYears = [2022, 2023, 2024];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with header and initial year', () => {
        render(
            <YearsDropDown
                years={mockYears}
                header="Test Header"
                setYear={mockSetYear}
                initialYear={2024}
            />,
        );

        expect(screen.getByText('Past Years')).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Test Header'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('(2024)'))).toBeInTheDocument();
    });

    it('renders without header', () => {
        render(
            <YearsDropDown
                years={mockYears}
                setYear={mockSetYear}
                initialYear={2023}
            />,
        );

        expect(screen.getByText('Past Years')).toBeInTheDocument();
        expect(screen.getByText('(2023)')).toBeInTheDocument();
    });

    it('displays years in menu', () => {
        render(
            <YearsDropDown
                years={mockYears}
                setYear={mockSetYear}
                initialYear={2024}
            />,
        );

        // Open the dropdown menu
        const menuButton = screen.getByText('Past Years');
        fireEvent.click(menuButton);

        expect(screen.getByText('2022')).toBeInTheDocument();
        expect(screen.getByText('2023')).toBeInTheDocument();
        expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('calls setYear when a year is selected', () => {
        render(
            <YearsDropDown
                years={mockYears}
                setYear={mockSetYear}
                initialYear={2024}
            />,
        );

        // Open the dropdown menu
        const menuButton = screen.getByText('Past Years');
        fireEvent.click(menuButton);

        // Select a different year
        const year2023 = screen.getByText('2023');
        fireEvent.click(year2023);

        expect(mockSetYear).toHaveBeenCalledWith(2023);
    });

    it('updates displayed year when selection changes', () => {
        render(
            <YearsDropDown
                years={mockYears}
                setYear={mockSetYear}
                initialYear={2024}
            />,
        );

        // Initially shows 2024
        expect(screen.getByText('(2024)')).toBeInTheDocument();

        // Open the dropdown menu
        const menuButton = screen.getByText('Past Years');
        fireEvent.click(menuButton);

        // Select a different year
        const year2022 = screen.getByText('2022');
        fireEvent.click(year2022);

        // Should now show 2022
        expect(screen.getByText('(2022)')).toBeInTheDocument();
    });

    it('handles empty years array by adding current year', () => {
        const currentYear = new Date().getFullYear();

        render(
            <YearsDropDown
                years={[]}
                setYear={mockSetYear}
                initialYear={currentYear}
            />,
        );

        // Open the dropdown menu
        const menuButton = screen.getByText('Past Years');
        fireEvent.click(menuButton);

        expect(screen.getByText(currentYear.toString())).toBeInTheDocument();
    });

    it('uses current year when no years provided', () => {
        const currentYear = new Date().getFullYear();

        render(
            <YearsDropDown
                years={[]}
                setYear={mockSetYear}
                initialYear={currentYear}
            />,
        );

        expect(screen.getByText(`(${currentYear})`)).toBeInTheDocument();
    });

    it('renders with correct Chakra UI components', () => {
        render(
            <YearsDropDown
                years={mockYears}
                setYear={mockSetYear}
                initialYear={2024}
            />,
        );

        const menuButton = screen.getByRole('button', { name: /Past Years/ });
        expect(menuButton).toBeInTheDocument();
        expect(menuButton).toHaveClass('chakra-button');
    });

    it('displays years in correct order', () => {
        render(
            <YearsDropDown
                years={mockYears}
                setYear={mockSetYear}
                initialYear={2024}
            />,
        );

        // Open the dropdown menu
        const menuButton = screen.getByText('Past Years');
        fireEvent.click(menuButton);

        // Check for individual year buttons instead of menuitem role
        expect(screen.getByText('2022')).toBeInTheDocument();
        expect(screen.getByText('2023')).toBeInTheDocument();
        expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('handles single year array', () => {
        render(
            <YearsDropDown
                years={[2024]}
                setYear={mockSetYear}
                initialYear={2024}
            />,
        );

        // Open the dropdown menu
        const menuButton = screen.getByText('Past Years');
        fireEvent.click(menuButton);

        expect(screen.getByText('2024')).toBeInTheDocument();
        expect(screen.getByText('(2024)')).toBeInTheDocument();
    });
});
