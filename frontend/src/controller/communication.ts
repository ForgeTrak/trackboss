import { apiRequest } from './utils';

import { MemberCommunication } from '../../../src/typedefs/memberCommunication';

export function getCommunications(token: string): Promise<MemberCommunication[]> {
    return apiRequest(token, 'GET', '/api/memberCommunication');
}

export function createCommunication(token: string, req: MemberCommunication) {
    return apiRequest(token, 'POST', '/api/memberCommunication', req);
}
