import { apiRequest } from './utils';
import { MemberType } from '../../../src/typedefs/memberType';

// eslint-disable-next-line import/prefer-default-export
export function getMembershipTypeCounts(token: string): Promise<MemberType[]> {
    return apiRequest(token, 'GET', '/api/memberType/membershipCounts');
}
