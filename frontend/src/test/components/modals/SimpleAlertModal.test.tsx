import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SimpleAlertModal from '../../../components/modals/SimpleAlertModal';

describe('SimpleAlertModal', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders when isOpen is true', () => {
        render(
            <SimpleAlertModal
                isOpen
                onClose={mockOnClose}
                message="Test message"
                title="Test Title"
            />,
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test message')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(
            <SimpleAlertModal
                isOpen={false}
                onClose={mockOnClose}
                message="Test message"
                title="Test Title"
            />,
        );

        expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('calls onClose when Close button is clicked', () => {
        render(
            <SimpleAlertModal
                isOpen
                onClose={mockOnClose}
                message="Test message"
                title="Test Title"
            />,
        );

        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders with undefined message', () => {
        render(
            <SimpleAlertModal
                isOpen
                onClose={mockOnClose}
                message={undefined}
                title="Test Title"
            />,
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders with empty message', () => {
        render(
            <SimpleAlertModal
                isOpen
                onClose={mockOnClose}
                message=""
                title="Test Title"
            />,
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders with long message', () => {
        const longMessage = 'This is a very long message that should still render properly in the modal body without any issues.';

        render(
            <SimpleAlertModal
                isOpen
                onClose={mockOnClose}
                message={longMessage}
                title="Long Message Test"
            />,
        );

        expect(screen.getByText('Long Message Test')).toBeInTheDocument();
        expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
});
