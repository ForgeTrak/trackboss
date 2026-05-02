import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import logger from '../logger';
import { MemberCommunication } from '../typedefs/memberCommunication';
import { getEnvironmentParameter } from './environmentWrapper';

export default async function publishCommunicationSqs(communication : MemberCommunication) {
    // now stick the message in the respective SQS queue for further processing.
    const outboundQueueName = `forgetrak-prod-queue-${communication.mechanism}`;
    const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

    logger.info(`sqspublisher -sending communication ${communication.memberCommunicationId} to outbound queue`);
    const region = await getEnvironmentParameter('region');
    const account = await getEnvironmentParameter('account');
    const sqsUrl = `https://sqs.${region}.amazonaws.com/${account}/${outboundQueueName}`;
    let result = {};
    try {
        const messageResult = await sqs.send(new SendMessageCommand({
            MessageBody: JSON.stringify(communication),
            QueueUrl: sqsUrl,
        }));
        result = messageResult;
        // eslint-disable-next-line max-len
        logger.info(`sqspublisher - Communication is ${communication.memberCommunicationId} enqueued as ${messageResult.MessageId}`);
    } catch (error) {
        // eslint-disable-next-line max-len
        logger.error(`sqspublisher - queue send failed for communication ${communication.memberCommunicationId} due to `, error);
        logger.error(`sqspublisher - The message with subject ${communication.subject} will not be delivered.`);
    }
    return result;
}
