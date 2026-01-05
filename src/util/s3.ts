import {
    GetObjectCommand,
    NoSuchKey,
    S3Client,
    S3ServiceException,
} from '@aws-sdk/client-s3';

export default async function getBackupFile() {
    const s3Client = new S3Client({ region: 'us-east-1' });
    const bucketName = 'forgetrak-data-backup';
    const backupFileKey = 'db-backups/pradb/databackup.sql.gz';
    const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: backupFileKey,
    });

    try {
        const data = await s3Client.send(getObjectCommand);
        console.log('Backup file retrieved successfully:', data);
        const fileContents = await data.Body?.transformToByteArray() || [];
        const buf = Buffer.from(fileContents);
        return buf;
    } catch (error) {
        if (error instanceof S3ServiceException && error.name === NoSuchKey.name) {
            console.error('Backup file does not exist.');
        } else {
            console.error('Error retrieving backup file:', error);
        }
        throw error;
    }
}
