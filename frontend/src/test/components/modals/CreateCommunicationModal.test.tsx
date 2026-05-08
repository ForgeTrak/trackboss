import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateCommunicationModal from '../../../components/modals/CreateCommunicationModal';
import * as communicationController from '../../../controller/communication';

vi.mock('../../../controller/communication');
vi.mock('../../../hooks/useAppToast', () => ({
    useAppToast: () => ({
        success: vi.fn(),
        error: vi.fn(),
    }),
}));
vi.mock('react-quill', () => ({
    default: ({ onChange, placeholder }: any) => (
        <textarea
            data-testid="react-quill"
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

describe('CreateCommunicationModal', () => {
    const mockOnClose = vi.fn();
    const mockAddAction = vi.fn();
    const mockTags = [
        { id: 1, value: 'Member', count: 5 },
        { id: 2, value: 'Board', count: 3 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(communicationController.createCommunication).mockResolvedValue(undefined);
    });

    it('renders when isOpen is true', () => {
        render(
            <CreateCommunicationModal
                isOpen
                token="test-token"
                userId={1}
                onClose={mockOnClose}
                addAction={mockAddAction}
                tags={mockTags}
            />,
        );

        expect(screen.getByText('Communication to membership')).toBeInTheDocument();
        expect(screen.getByText('Subject')).toBeInTheDocument();
        expect(screen.getByText('Communication Type')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Send')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(
            <CreateCommunicationModal
                isOpen={false}
                token="test-token"
                userId={1}
                onClose={mockOnClose}
                addAction={mockAddAction}
                tags={mockTags}
            />,
        );

        expect(screen.queryByText('Communication to membership')).not.toBeInTheDocument();
    });

    it('calls onClose when Cancel button is clicked', () => {
        render(
            <CreateCommunicationModal
                isOpen
                token="test-token"
                userId={1}
                onClose={mockOnClose}
                addAction={mockAddAction}
                tags={mockTags}
            />,
        );

        fireEvent.click(screen.getByText('Cancel'));

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('resets mechanism and subject on Cancel', () => {
        render(
            <CreateCommunicationModal
                isOpen
                token="test-token"
                userId={1}
                onClose={mockOnClose}
                addAction={mockAddAction}
                tags={mockTags}
            />,
        );

        // Change communication type to TEXT
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'TEXT' } });

        // Type a subject (first textbox is the subject input, second is the quill editor)
        const subjectInput = screen.getAllByRole('textbox')[0];
        fireEvent.change(subjectInput, { target: { value: 'My Subject' } });

        // Cancel the modal
        fireEvent.click(screen.getByText('Cancel'));

        expect(mockOnClose).toHaveBeenCalledTimes(1);

        // Re-render with isOpen true to verify state was reset
        const { unmount } = render(
            <CreateCommunicationModal
                isOpen
                token="test-token"
                userId={1}
                onClose={mockOnClose}
                addAction={mockAddAction}
                tags={mockTags}
            />,
        );

        // The select should be back to EMAIL (first option selected)
        const freshSelect = screen.getAllByRole('combobox')[0];
        expect(freshSelect).toHaveValue('EMAIL');

        unmount();
    });

    it('resets mechanism and subject on Send so next send uses defaults', async () => {
        render(
            <CreateCommunicationModal
                isOpen
                token="test-token"
                userId={1}
                onClose={mockOnClose}
                addAction={mockAddAction}
                tags={mockTags}
            />,
        );

        // Change communication type to TEXT and type a subject
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TEXT' } });
        fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'First Subject' } });

        // Send first communication
        fireEvent.click(screen.getByText('Send'));

        await waitFor(() => {
            expect(communicationController.createCommunication).toHaveBeenCalledWith(
                'test-token',
                expect.objectContaining({
                    subject: 'First Subject',
                    mechanism: 'TEXT',
                }),
            );
        });

        // resetPopupState resets mechanism to 'EMAIL' and subject to '' internally.
        // Send again without changing any fields to verify the internal state was reset.
        fireEvent.click(screen.getByText('Send'));

        await waitFor(() => {
            expect(communicationController.createCommunication).toHaveBeenCalledTimes(2);
        });

        // The second call should use the reset defaults (EMAIL, empty subject)
        const secondCall = vi.mocked(communicationController.createCommunication).mock.calls[1];
        expect(secondCall[1].mechanism).toBe('EMAIL');
        expect(secondCall[1].subject).toBe('');
    });

    it('renders tag checkboxes from props', () => {
        render(
            <CreateCommunicationModal
                isOpen
                token="test-token"
                userId={1}
                onClose={mockOnClose}
                addAction={mockAddAction}
                tags={mockTags}
            />,
        );

        // Tags are inside an accordion, expand it
        fireEvent.click(screen.getByText(/Audience Tags/));

        expect(screen.getByText('Member')).toBeInTheDocument();
        expect(screen.getByText('Board')).toBeInTheDocument();
    });

    it('renders with no tags', () => {
        render(
            <CreateCommunicationModal
                isOpen
                token="test-token"
                userId={1}
                onClose={mockOnClose}
                addAction={mockAddAction}
                tags={[]}
            />,
        );

        expect(screen.getByText('Communication to membership')).toBeInTheDocument();
    });

    it('sends communication with correct data on Send', async () => {
        render(
            <CreateCommunicationModal
                isOpen
                token="test-token"
                userId={1}
                onClose={mockOnClose}
                addAction={mockAddAction}
                tags={mockTags}
            />,
        );

        // Fill subject (first textbox is the subject input, second is the quill editor)
        const subjectInput = screen.getAllByRole('textbox')[0];
        fireEvent.change(subjectInput, { target: { value: 'Newsletter' } });

        // Click Send
        fireEvent.click(screen.getByText('Send'));

        await waitFor(() => {
            expect(communicationController.createCommunication).toHaveBeenCalledWith(
                'test-token',
                expect.objectContaining({
                    subject: 'Newsletter',
                    mechanism: 'EMAIL',
                    senderId: 1,
                }),
            );
        });
    });
});
