import { ErrorResponse } from './errorResponse';

export type PaidLabor = {
    paidLaborId?: number,
    tenantId?: string,
    firstName?: string,
    lastName?: string,
    businessName?: string,
    phoneNumber?: string,
    email?: string,
    createdAt?: Date,
    updatedAt?: Date,
}

export type GetPaidLaborResponse = PaidLabor | PaidLabor[] | ErrorResponse;

export type DeletePaidLaborResponse = PaidLabor | ErrorResponse;
