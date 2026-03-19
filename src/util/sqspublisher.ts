import AWS from 'aws-sdk';
import logger from '../logger';
import { MemberCommunication } from '../typedefs/memberCommunication';
import { getEnvironmentParameter } from './environmentWrapper';

export default async function publishCommunicationSqs(communication : MemberCommunication) {
    // now stick the message in the respective SQS queue for further processing.
    const outboundQueueName = `trackboss-queue-${communication.mechanism}`;
    AWS.config.update({ region: process.env.AWS_REGION });
    const sqs = new AWS.SQS();

    logger.info(`sqspublisher -sending communication ${communication.memberCommunicationId} to outbound queue`);
    const region = await getEnvironmentParameter('region');
    const account = await getEnvironmentParameter('account');
    const sqsUrl = `https://sqs.${region}.amazonaws.com/${account}/${outboundQueueName}`;
    let result = {};
    sqs.sendMessage({
        MessageBody: JSON.stringify(communication),
        QueueUrl: sqsUrl,
    }, (error, messageResult) => {
        if (error) {
            // eslint-disable-next-line max-len
            logger.error(`sqspublisher - queue send failed for communication ${communication.memberCommunicationId} due to `, error);
            logger.error(`sqspublisher - The message with subject ${communication.subject} will not be delivered.`);
            return;
        }
        result = messageResult;
        // eslint-disable-next-line max-len
        logger.info(`sqspublisher - Communication is ${communication.memberCommunicationId} enqueued as ${messageResult.MessageId}`);
    });
    return result;
}
