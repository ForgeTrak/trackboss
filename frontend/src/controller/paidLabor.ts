import {
    DeletePaidLaborResponse,
    GetPaidLaborResponse,
    PaidLabor,
} from '../../../src/typedefs/paidLabor';
import { apiRequest } from './utils';

export function getPaidLaborList(token: string): Promise<GetPaidLaborResponse> {
    return apiRequest(token, 'GET', '/api/paidLabor/list');
}

export function deletePaidLabor(token: string, id: number): Promise<DeletePaidLaborResponse> {
    return apiRequest(token, 'DELETE', `/api/paidLabor/${id}`);
}

export function updatePaidLabor(token: string, laborer: PaidLabor): Promise<GetPaidLaborResponse> {
    return apiRequest(token, 'PATCH', `/api/paidLabor/${laborer.paidLaborId}`, laborer);
}

export function createPaidLabor(token: string, laborer: PaidLabor): Promise<PaidLabor> {
    return apiRequest(token, 'POST', '/api/paidLabor', laborer);
}
