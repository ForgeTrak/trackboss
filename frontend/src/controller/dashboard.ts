import { apiRequest } from './utils';

export default function getDashboardData(token: string, membershipId: number): Promise<any> {
    return apiRequest(token, 'GET', `/api/dashboard?membershipId=${membershipId}`);
}
