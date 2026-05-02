jest.mock('../../util/environmentWrapper', () => ({
    getEnvironmentParameter: jest.fn(),
}));

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-sqs', () => {
    const actual = jest.requireActual('@aws-sdk/client-sqs');
    return {
        ...actual,
        SQSClient: jest.fn().mockImplementation(() => ({
            send: mockSend,
        })),
    };
});

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
        mockSend.mockResolvedValue({ MessageId: 'msg-1' });
    });

    it('invokes sendMessage with queue URL and JSON body', async () => {
        const comm = {
            memberCommunicationId: 42,
            mechanism: 'email',
            subject: 'Hi',
        } as any;
        await publishCommunicationSqs(comm);
        expect(mockSend).toHaveBeenCalledTimes(1);
        const command = mockSend.mock.calls[0][0];
        expect(command.input).toEqual(expect.objectContaining({
            MessageBody: JSON.stringify(comm),
            QueueUrl: 'https://sqs.us-east-1.amazonaws.com/111122223333/forgetrak-prod-queue-email',
        }));
    });

    it('still resolves when sendMessage reports error (logs only)', async () => {
        mockSend.mockRejectedValue(new Error('sqs failed'));
        const result = await publishCommunicationSqs({
            memberCommunicationId: 1,
            mechanism: 'sms',
            subject: 'S',
        } as any);
        expect(result).toEqual({});
    });
});
