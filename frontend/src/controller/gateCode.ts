import { apiRequest } from './utils';

import { GetGateCodeResponse } from '../../../src/typedefs/gateCode';

export function getGateCodeLatest(token: string, membershipId?: number): Promise<GetGateCodeResponse> {
    return apiRequest(token, 'GET', `/api/gateCode/latest?membershipId=${membershipId}`);
}

export function createGateCode(token: string, gateCode: string): Promise<GetGateCodeResponse> {
    const gateCodeRequest = {
        year: (new Date()).getFullYear(),
        gateCode,
    };
    return apiRequest(token, 'POST', '/api/gateCode/latest', gateCodeRequest);
}
