import { GetLinkResponse } from '../../../src/typedefs/link';
import { apiRequest } from './utils';

// eslint-disable-next-line import/prefer-default-export
export function getLinks(token: string): Promise<GetLinkResponse> {
    return apiRequest(token, 'GET', '/api/link/list');
}
