import { NoSuchKey, S3ServiceException } from '@aws-sdk/client-s3';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
    const actual = jest.requireActual('@aws-sdk/client-s3');
    return {
        ...actual,
        S3Client: jest.fn().mockImplementation(() => ({
            send: mockSend,
        })),
    };
});

import getBackupFile from '../../util/s3';

describe('util/s3', () => {
    beforeEach(() => {
        mockSend.mockReset();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns buffer when GetObject succeeds', async () => {
        const bytes = new Uint8Array([1, 2, 3]);
        mockSend.mockResolvedValue({
            Body: {
                transformToByteArray: jest.fn().mockResolvedValue(bytes),
            },
        });
        const buf = await getBackupFile();
        expect(Buffer.isBuffer(buf)).toBe(true);
        expect([...buf]).toEqual([1, 2, 3]);
    });

    it('rethrows NoSuchKey after logging', async () => {
        const err = new S3ServiceException({ name: NoSuchKey.name, message: 'no key' } as any);
        mockSend.mockRejectedValue(err);
        await expect(getBackupFile()).rejects.toBe(err);
    });

    it('rethrows other S3 errors', async () => {
        const err = new Error('network');
        mockSend.mockRejectedValue(err);
        await expect(getBackupFile()).rejects.toBe(err);
    });
});
