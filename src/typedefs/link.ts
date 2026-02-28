import { ErrorResponse } from './errorResponse';

export type Link = {
    linkId: number,
    tenantId: string,
    linkTitle: string,
    linkUrl: string,
    linkDisplayOrder: number,
};

export type GetLinkResponse = Link[] | ErrorResponse;
