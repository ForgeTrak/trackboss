import { ErrorResponse } from './errorResponse';

export type RidingAreaStatus = {
    id?: number,
    tenantId?: string,
    name: string,
    isOpen: boolean,
}

export type PatchRidingAreaStatusRequest = {
    name: string,
    isOpen: boolean,
}

export type PatchRidingAreaStatusResponse = RidingAreaStatus | ErrorResponse;

export type GetRidingAreaStatusRequest = Record<string, never>;

export type GetRidingAreaStatusResponse = RidingAreaStatus[] | ErrorResponse;
