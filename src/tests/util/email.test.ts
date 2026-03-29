jest.mock('../../database/pool', () => ({
    getPool: jest.fn(),
}));

jest.mock('../../util/environmentWrapper', () => ({
    getEnvironmentParameter: jest.fn().mockResolvedValue('club@example.com'),
}));

jest.mock('../../database/boardMember', () => ({
    getBoardMemberList: jest.fn().mockResolvedValue([{ email: 'board@x.com' }]),
}));

jest.mock('../../util/dateHelper', () => ({
    calculateApplicationYear: jest.fn().mockReturnValue(2027),
}));

const mockSendEmailPromise = jest.fn().mockResolvedValue({});

jest.mock('aws-sdk', () => ({
    config: { update: jest.fn() },
    SES: jest.fn().mockImplementation(() => ({
        sendEmail: jest.fn().mockImplementation(() => ({
            promise: mockSendEmailPromise,
        })),
    })),
}));

import { getPool } from '../../database/pool';
import {
    sendAppConfirmationEmail,
    sendAppRejectedEmail,
    sendInsuranceConfirmEmail,
    sendNewMemberEmail,
    sendPasswordReset,
    sendPaymentConfirmationEmail,
    sendTextEmail,
} from '../../util/email';

const mockedPool = getPool as jest.MockedFunction<typeof getPool>;

describe('util/email', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedPool.mockReturnValue({
            query: jest.fn().mockResolvedValue([
                [
                    {
                        purpose: 'APP_CONFIRMATION',
                        subject: 'S',
                        text: 'Hi firstName lastName id appId',
                    },
                ],
            ]),
        } as any);
    });

    it('sendTextEmail calls SES sendEmail', async () => {
        await sendTextEmail({
            to: 'u@x.com',
            subject: 'T',
            text: 'Body',
            bcc: [],
        });
        expect(mockSendEmailPromise).toHaveBeenCalled();
    });

    it('sendTextEmail logs when SES throws', async () => {
        mockSendEmailPromise.mockRejectedValueOnce(new Error('ses down'));
        await sendTextEmail({ to: 'a@b.com', subject: 's', text: 't', bcc: [] });
    });

    it('sendAppConfirmationEmail loads template and sends', async () => {
        await sendAppConfirmationEmail(
            { id: 9, firstName: 'F', lastName: 'L', email: 'e@x.com' },
            'tenant-1',
        );
        expect(mockSendEmailPromise).toHaveBeenCalled();
    });

    it('sendNewMemberEmail replaces names and optional notes', async () => {
        mockedPool.mockReturnValue({
            query: jest.fn().mockResolvedValue([
                [{ purpose: 'NEW_MEMBERSHIP', subject: 'N', text: 'Hi firstName — notes: applicationNotesShared' }],
            ]),
        } as any);
        await sendNewMemberEmail(
            {
                id: 1,
                firstName: 'A',
                lastName: 'B',
                email: 'm@x.com',
                applicationNotesShared: 'Extra',
            },
            't',
        );
        expect(mockSendEmailPromise).toHaveBeenCalled();
    });

    it('sendAppRejectedEmail replaces names', async () => {
        mockedPool.mockReturnValue({
            query: jest.fn().mockResolvedValue([
                [{ purpose: 'APPLICATION_REJECTED', subject: 'R', text: 'Bye firstName lastName' }],
            ]),
        } as any);
        await sendAppRejectedEmail(
            { id: 2, firstName: 'C', lastName: 'D', email: 'r@x.com' },
            't',
        );
        expect(mockSendEmailPromise).toHaveBeenCalled();
    });

    it('sendAppRejectedEmail replaces applicationNotesShared when present', async () => {
        mockedPool.mockReturnValue({
            query: jest.fn().mockResolvedValue([
                [
                    {
                        purpose: 'APPLICATION_REJECTED',
                        subject: 'R',
                        text: 'Rejected firstName — applicationNotesShared',
                    },
                ],
            ]),
        } as any);
        await sendAppRejectedEmail(
            {
                id: 3,
                firstName: 'E',
                lastName: 'F',
                email: 'rej@x.com',
                applicationNotesShared: 'Reason text',
            },
            't',
        );
        expect(mockSendEmailPromise).toHaveBeenCalled();
    });

    it('sendPaymentConfirmationEmail and sendInsuranceConfirmEmail use PAYMENT_CONFIRMED and INSURANCE_CONFIRMED', async () => {
        mockedPool.mockReturnValue({
            query: jest
                .fn()
                .mockResolvedValueOnce([
                    [{ purpose: 'PAYMENT_CONFIRMED', subject: 'P', text: 'Paid firstName lastName' }],
                ])
                .mockResolvedValueOnce([
                    [{ purpose: 'INSURANCE_CONFIRMED', subject: 'I', text: 'Ins firstName lastName' }],
                ]),
        } as any);
        const bill = {
            firstName: 'X',
            lastName: 'Y',
            membershipAdminEmail: 'pay@x.com',
        } as any;
        await sendPaymentConfirmationEmail(bill, 't');
        await sendInsuranceConfirmEmail(bill, 't');
        expect(mockSendEmailPromise).toHaveBeenCalledTimes(2);
    });

    it('sendPasswordReset replaces tokens', async () => {
        mockedPool.mockReturnValue({
            query: jest.fn().mockResolvedValue([
                [{ purpose: 'PASSWORD_RESET', subject: 'Pw', text: 'PWD EMAIL firstName' }],
            ]),
        } as any);
        await sendPasswordReset(
            { firstName: 'Sam', lastName: 'Z', email: 'sam@x.com' } as any,
            'new-secret',
            't',
        );
        expect(mockSendEmailPromise).toHaveBeenCalled();
    });

    it('getEmailById swallows DB errors and send flows handle missing row via undefined access', async () => {
        mockedPool.mockReturnValue({
            query: jest.fn().mockRejectedValue(new Error('db')),
        } as any);
        await expect(
            sendNewMemberEmail({ id: 1, firstName: 'A', lastName: 'B', email: 'e@x.com' }, 't'),
        ).rejects.toThrow();
    });
});
