import { Member } from './member';

export type MemberCommunication = {
    memberCommunicationId?: number,
    tenantId?: string,
    subject: string,
    mechanism: string,
    senderId: number,
    senderName?: string,
    text: string,
    selectedTags: string[],
    sentDate?: Date,
    members?: any,
    fromEmail?: string,
};
