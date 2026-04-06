import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddEventTypeModal from '../../../components/modals/AddEventTypeModal';
import * as eventTypeController from '../../../controller/eventType';

// Mock the dependencies
vi.mock('../../../controller/eventType');

describe('AddEventTypeModal', () => {
    const mockOnClose = vi.fn();
    const mockAddAction = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(eventTypeController.createEventType).mockResolvedValue(undefined);
    });

    it('renders when isOpen is true', () => {
        render(
            <AddEventTypeModal
                isOpen
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        expect(screen.getByText('Add an event type')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Event Type Name')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(
            <AddEventTypeModal
                isOpen={false}
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        expect(screen.queryByText('Add an event type')).not.toBeInTheDocument();
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('calls onClose when Cancel button is clicked', () => {
        render(
            <AddEventTypeModal
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

    it('allows typing in the event type input', () => {
        render(
            <AddEventTypeModal
                isOpen
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        const input = screen.getByPlaceholderText('Event Type Name');
        fireEvent.change(input, { target: { value: 'Test Event Type' } });

        expect(input).toHaveValue('Test Event Type');
    });

    it('calls createEventType when Save button is clicked with valid data', async () => {
        render(
            <AddEventTypeModal
                isOpen
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        const input = screen.getByPlaceholderText('Event Type Name');
        fireEvent.change(input, { target: { value: 'Test Event Type' } });

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        expect(eventTypeController.createEventType).toHaveBeenCalledWith('test-token', {
            modifiedBy: 123,
            type: 'Test Event Type',
        });
    });

    it('calls addAction and onClose after successful event type creation', async () => {
        render(
            <AddEventTypeModal
                isOpen
                token="test-token"
                userId={123}
                onClose={mockOnClose}
                addAction={mockAddAction}
            />,
        );

        const input = screen.getByPlaceholderText('Event Type Name');
        fireEvent.change(input, { target: { value: 'Test Event Type' } });

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        // Wait for async operation
        await vi.waitFor(() => {
            expect(mockAddAction).toHaveBeenCalledTimes(1);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });
});
