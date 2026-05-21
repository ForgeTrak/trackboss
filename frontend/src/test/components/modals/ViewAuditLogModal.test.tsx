import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ViewAuditLogModal from '../../../components/modals/ViewAuditLogModal';

describe('ViewAuditLogModal', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockAuditLog = {
        user_action: 'CREATE',
        entity_type: 'MEMBER',
        entity_id: '123',
        change_details: {
            name: 'John Doe',
            email: 'john@example.com',
        },
    };

    it('renders when isOpen is true with audit log data', () => {
        render(
            <ViewAuditLogModal
                auditLog={mockAuditLog}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('CREATE')).toBeInTheDocument();
        expect(screen.getByText('Entity Type')).toBeInTheDocument();
        expect(screen.getByText('MEMBER')).toBeInTheDocument();
        expect(screen.getByText('Entity ID')).toBeInTheDocument();
        expect(screen.getByText('123')).toBeInTheDocument();
        expect(screen.getByText('Change Details')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders with N/A values when audit log is undefined', () => {
        render(
            <ViewAuditLogModal
                auditLog={undefined}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getAllByText('N/A')).toHaveLength(4);
        expect(screen.getByText('Entity Type')).toBeInTheDocument();
        expect(screen.getByText('Entity ID')).toBeInTheDocument();
        expect(screen.getByText('Change Details')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders with N/A values when audit log properties are missing', () => {
        const emptyAuditLog = {
            user_action: null,
            entity_type: null,
            entity_id: null,
            change_details: null,
        };

        render(
            <ViewAuditLogModal
                auditLog={emptyAuditLog}
                isOpen
                onClose={mockOnClose}
            />,
        );

        expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
        expect(screen.getAllByText('N/A')).toHaveLength(4);
    });

    it('displays JSON formatted change details', () => {
        render(
            <ViewAuditLogModal
                auditLog={mockAuditLog}
                isOpen
                onClose={mockOnClose}
            />,
        );

        const matcher = (content: string) => (
            content.includes('"name": "John Doe"') && content.includes('"email": "john@example.com"')
        );
        const changeDetailsElement = screen.getByText(matcher);
        expect(changeDetailsElement).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(
            <ViewAuditLogModal
                auditLog={mockAuditLog}
                isOpen={false}
                onClose={mockOnClose}
            />,
        );

        expect(screen.queryByText('Audit Log Details')).not.toBeInTheDocument();
        expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });

    it('calls onClose when Close button is clicked', () => {
        render(
            <ViewAuditLogModal
                auditLog={mockAuditLog}
                isOpen
                onClose={mockOnClose}
            />,
        );

        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
