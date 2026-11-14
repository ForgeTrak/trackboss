import { ErrorResponse } from './errorResponse';

export type Link = {
    linkId?: number,
    tenantId?: string,
    linkTitle: string,
    linkUrl: string,
    linkDisplayOrder?: number,
    online?: boolean,
};

export type GetLinkResponse = Link | Link[] | ErrorResponse;

export type DeleteLinkResponse = { linkId: number } | ErrorResponse;
