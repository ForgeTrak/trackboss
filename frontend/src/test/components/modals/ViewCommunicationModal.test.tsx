import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ViewCommunicationModal from '../../../components/modals/ViewCommunicationModal';

describe('ViewCommunicationModal', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCommunication = {
        senderId: 123,
        subject: 'Test Subject',
        selectedTags: ['tag1', 'tag2', 'tag3'],
        mechanism: 'Email',
        text: '<p>This is a test communication with <strong>bold text</strong>.</p>',
    };

    it('renders when isOpen is true with communication data', () => {
        render(
            <ViewCommunicationModal
                communication={mockCommunication}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Communication to PRA membership')).toBeInTheDocument();
        expect(screen.getByText('Subject')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Subject')).toBeInTheDocument();
        expect(screen.getByText('Selected Tags')).toBeInTheDocument();
        expect(screen.getByDisplayValue('tag1,tag2,tag3')).toBeInTheDocument();
        expect(screen.getByText('Communication Type')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Email')).toBeInTheDocument();
        expect(screen.getByText('Communication Content')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders with empty communication when communication is undefined', () => {
        render(
            <ViewCommunicationModal
                communication={undefined}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Communication to PRA membership')).toBeInTheDocument();
        expect(screen.getByText('Subject')).toBeInTheDocument();
        expect(screen.getByText('Selected Tags')).toBeInTheDocument();
        expect(screen.getByText('Communication Type')).toBeInTheDocument();
        expect(screen.getByText('Communication Content')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders with empty values when communication properties are missing', () => {
        const emptyCommunication = {
            senderId: 123,
            subject: '',
            selectedTags: [],
            mechanism: '',
            text: '',
        };

        render(
            <ViewCommunicationModal
                communication={emptyCommunication}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Communication to PRA membership')).toBeInTheDocument();
        expect(screen.getAllByDisplayValue('')).toHaveLength(3); // Should have 3 empty inputs
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders HTML content in communication text', () => {
        render(
            <ViewCommunicationModal
                communication={mockCommunication}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText((content) => content.includes('This is a test communication'))).toBeInTheDocument();
        expect(screen.getByText('bold text')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(
            <ViewCommunicationModal
                communication={mockCommunication}
                isOpen={false}
                onClose={mockOnClose}
            />,
        );

        expect(screen.queryByText('Communication to PRA membership')).not.toBeInTheDocument();
        expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });

    it('calls onClose when Close button is clicked', () => {
        render(
            <ViewCommunicationModal
                communication={mockCommunication}
                isOpen
                onClose={mockOnClose}
            />,
        );

        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('handles communication with no selected tags', () => {
        const communicationWithoutTags = {
            senderId: 123,
            subject: 'Test Subject',
            selectedTags: undefined,
            mechanism: 'SMS',
            text: '<p>Test message</p>',
        };

        render(
            <ViewCommunicationModal
                communication={communicationWithoutTags}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByDisplayValue('Test Subject')).toBeInTheDocument();
        expect(screen.getByDisplayValue('')).toBeInTheDocument(); // selectedTags should be empty
        expect(screen.getByDisplayValue('SMS')).toBeInTheDocument();
    });

    it('handles communication with no text content', () => {
        const communicationWithoutText = {
            senderId: 123,
            subject: 'Test Subject',
            selectedTags: ['test'],
            mechanism: 'Email',
            text: undefined,
        };

        render(
            <ViewCommunicationModal
                communication={communicationWithoutText}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Communication Content')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });
});
