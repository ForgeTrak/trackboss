import { apiRequest, apiRequestBlob } from './utils';
import {
    GetBillListResponse,
    GetMembershipBillListResponse,
    GetWorkPointThresholdResponse,
    PostCalculateBillsResponse,
    PostPayBillResponse,
    WorkPointThreshold,
} from '../../../src/typedefs/bill';
import { ErrorResponse } from '../../../src/typedefs/errorResponse';

function isThreshold(res: WorkPointThreshold | ErrorResponse): res is WorkPointThreshold {
    return (res as WorkPointThreshold) !== undefined;
}

export function getYearlyThreshold(token: string, year?: number): Promise<GetWorkPointThresholdResponse> {
    const path = typeof year === 'undefined'
        ? '/api/billing/yearlyWorkPointThreshold'
        : `/api/billing/yearlyWorkPointThreshold?year=${year}`;
    return apiRequest(token, 'GET', path);
}

export async function getYearlyThresholdValue(token: string) {
    const threshold = await getYearlyThreshold(token);
    if (isThreshold(threshold)) {
        return threshold.threshold;
    }
    // else
    return undefined;
}

export function getBills(token: string, billingYear: number): Promise<GetBillListResponse> {
    return apiRequest(token, 'GET', `/api/billing/list?year=${billingYear}`);
}

export function getBillsForMembership(
    token: string,
    membershipID: number,
): Promise<GetMembershipBillListResponse> {
    return apiRequest(token, 'GET', `/api/billing/${membershipID}`);
}

export function generateBills(token: string): Promise<PostCalculateBillsResponse> {
    return apiRequest(token, 'POST', '/api/billing');
}

export function payBill(token: string, billId: number, paymentMethod: string): Promise<PostPayBillResponse> {
    return apiRequest(token, 'POST', `/api/billing/${billId}?paymentMethod=${paymentMethod}`);
}

export function attestInsurance(token: string, billId: number): Promise<PostPayBillResponse> {
    return apiRequest(token, 'PATCH', `/api/billing/attestIns/${billId}`);
}

export function markContactedAndRenewing(token: string, billId: number): Promise<PostPayBillResponse> {
    return apiRequest(token, 'PATCH', `/api/billing/markContacted/${billId}`);
}

export function discountBill(token: string, billId: number): Promise<PostPayBillResponse> {
    return apiRequest(token, 'PATCH', `/api/billing/discount/${billId}`);
}

export function getBillListExcel(token: string): Promise<Blob> {
    return apiRequestBlob(token, '/api/billing/list/excel');
}
