jest.mock('../../util/environmentWrapper', () => ({
    getEnvironmentParameter: jest.fn(),
}));

const mockSendMessage = jest.fn();

jest.mock('aws-sdk', () => ({
    config: { update: jest.fn() },
    SQS: jest.fn().mockImplementation(() => ({
        sendMessage: mockSendMessage,
    })),
}));

import { getEnvironmentParameter } from '../../util/environmentWrapper';
import publishCommunicationSqs from '../../util/sqspublisher';

const mockedGetParam = getEnvironmentParameter as jest.MockedFunction<typeof getEnvironmentParameter>;

describe('util/sqspublisher', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetParam.mockImplementation(async (name: string) => {
            if (name === 'region') return 'us-east-1';
            if (name === 'account') return '111122223333';
            return '';
        });
        mockSendMessage.mockImplementation((_params: unknown, cb: (e: Error | null, r?: unknown) => void) => {
            cb(null, { MessageId: 'msg-1' });
        });
    });

    it('invokes sendMessage with queue URL and JSON body', async () => {
        const comm = {
            memberCommunicationId: 42,
            mechanism: 'email',
            subject: 'Hi',
        } as any;
        await publishCommunicationSqs(comm);
        expect(mockSendMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                MessageBody: JSON.stringify(comm),
                QueueUrl: 'https://sqs.us-east-1.amazonaws.com/111122223333/trackboss-queue-email',
            }),
            expect.any(Function),
        );
    });

    it('still resolves when sendMessage reports error (callback logs only)', async () => {
        mockSendMessage.mockImplementation((_p: unknown, cb: (e: Error | null) => void) => {
            cb(new Error('sqs failed'));
        });
        const result = await publishCommunicationSqs({
            memberCommunicationId: 1,
            mechanism: 'sms',
            subject: 'S',
        } as any);
        expect(result).toEqual({});
    });
});
