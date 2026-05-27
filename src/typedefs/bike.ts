import { ErrorResponse } from './errorResponse';

export type Bike = {
    bikeId: number,
    year: string,
    make: string,
    model: string,
    membershipAdmin: string,
    tenantId?: string,
}

export type DeletedBike = {
    bikeId: number
}

export type PostNewBikeRequest = {
    year?: string,
    make?: string,
    model?: string,
    membershipId: number,
    tenantId?: string,
}

export type PostNewBikeResponse = Bike | ErrorResponse

export type GetBikeRequest = Record<string, never>

export type GetBikeResponse = Bike | ErrorResponse

export type PatchBikeRequest = {
    year?: string,
    make?: string,
    model?: string,
    membershipId?: number
    tenantId: string,
}

export type PatchBikeResponse = Bike | ErrorResponse

export type DeleteBikeRequest = Record<string, never>

export type DeleteBikeResponse = DeletedBike | ErrorResponse

export type GetBikeListRequest = Record<string, never>

export type GetBikeListResponse = Bike[] | ErrorResponse
