/* eslint-disable max-len */
import { Request, Response, Router } from 'express';
import AWS from 'aws-sdk';
import sanitizeHtml from 'sanitize-html';
import {
    getMemberCommunicationById, getMemberCommunications, insertMemberCommunication,
} from '../database/memberCommunication';
import { validateAdminAccess } from '../util/auth';
import logger from '../logger';
import { getMemberList, getMembersWithTag } from '../database/member';
import { MemberCommunication } from '../typedefs/memberCommunication';
import { getEnvironmentParameter } from '../util/environmentWrapper';
import { getBoardMemberList } from '../database/boardMember';
import logAuditEvent from '../database/auditLog';

const memberCommunication = Router();

memberCommunication.get('/', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const allCommunications = await getMemberCommunications(req.user.tenantId);
        res.send(allCommunications);
    } catch (error: any) {
        logger.error(`memberCommunication - Error at path ${req.path}`, error);
        res.status(500);
    }
});

memberCommunication.get('/:communicationId', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const id = Number(req.params.communicationId);
        const singleCommunication = await getMemberCommunicationById(id, req.user.tenantId);
        res.send(singleCommunication);
    } catch (error: any) {
        logger.error(`memberCommunication - Error at path ${req.path}`, error);
        res.status(500);
    }
});

memberCommunication.post('/', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const communication : MemberCommunication = req.body;
        // I add this here because we figure out what they are in this upcomign code block.
        communication.members = [];
        // on texts remove paragraph breaks inserted by Quill.
        if (communication.mechanism === 'TEXT') {
            communication.text = sanitizeHtml(communication.text, {
                allowedTags: [],
                allowedAttributes: {},
            });
        }
        // use the base object type as a hashmap with any keys you want in there.
        // learned this trick ages ago.
        const uniqueRecipients : any = {};
        if (communication.selectedTags && (communication.selectedTags.length > 0)) {
            // I want array iteration here because I want things to be in order.
            // eslint-disable-next-line no-restricted-syntax
            for (const tag of communication.selectedTags) {
                // this is on purpose too
                // eslint-disable-next-line no-await-in-loop
                const membersWithTags = await getMembersWithTag(tag);
                membersWithTags.forEach((member) => {
                    uniqueRecipients[member.memberId] = (member.memberId, member);
                });
            }
            const uniqueRecipientIds = Object.keys(uniqueRecipients);
            uniqueRecipientIds.forEach((id: any) => {
                const memberRecord = uniqueRecipients[id];
                const paredDownRecord = {
                    firstName: memberRecord.firstName,
                    lastName: memberRecord.lastName,
                    email: memberRecord.email,
                    phone: memberRecord.phoneNumber,
                };
                communication.members?.push(paredDownRecord);
            });
        } else {
            const allMembers = await getMemberList({}, req.user.tenantId);
            const subscribedMembers = allMembers.filter((member) => (member.active && member.subscribed));
            // track admins uniquely so we can also grab board members even if they aren't
            // membership admins.
            const uniqueSubscribedMembers : any = {};
            subscribedMembers.forEach((member) => {
                communication?.members.push({
                    firstName: member.firstName,
                    lastName: member.lastName,
                    email: member.email,
                    phone: member.phoneNumber,
                });
                // this is just a placeholder value so that we can check for it later.
                uniqueSubscribedMembers[member.memberId] = member;
            });
            // get all board members too, and if they aren't already in the list add them.
            const boardMembers = await getBoardMemberList(req.user.tenantId, new Date().getFullYear().toString());
            boardMembers.forEach((boardMember) => {
                // add board members who already not admins (this was a gaping hole in initial functionality as spouses
                // can be board members) but would not get texts.
                if (!uniqueSubscribedMembers[boardMember.memberId]) {
                    communication.members.push({
                        firstName: boardMember.firstName,
                        lastName: boardMember.lastName,
                        email: boardMember.email,
                        phone: boardMember.phone,
                    });
                }
            });
        }
        const response = await insertMemberCommunication(communication, req.user.tenantId);
        logAuditEvent(req, 'memberCommunication', response.memberCommunicationId, null, req.body);
        // now stick the message in the respective SQS queue for further processing.
        const outboundQueueName = `trackboss-queue-${communication.mechanism}`;
        AWS.config.update({ region: process.env.AWS_REGION });
        const sqs = new AWS.SQS();

        // eslint-disable-next-line max-len
        logger.info(`memberCommunication - Sending communication id ${response.memberCommunicationId} to outbound queue`);
        const region = await getEnvironmentParameter('region');
        const account = await getEnvironmentParameter('account');
        const sqsUrl = `https://sqs.${region}.amazonaws.com/${account}/${outboundQueueName}`;
        sqs.sendMessage({
            MessageBody: JSON.stringify(response),
            QueueUrl: sqsUrl,
        }, (error, messageResult) => {
            if (error) {
                logger.error(`memberCommunication - Queue send failed for communication ${response.memberCommunicationId} due to `, error);
                logger.error(`memberCommunication - The message with subject ${response.subject} will not be delivered.`);
                return;
            }
            logger.info(`memberCommunication - Communication is ${response.memberCommunicationId} enqueued as ${messageResult.MessageId}`);
        });

        res.json(response);
    } catch (error: any) {
        logger.error(`memberCommunication - Error at path ${req.path}`, error);
        res.status(500);
    }
});

export default memberCommunication;
