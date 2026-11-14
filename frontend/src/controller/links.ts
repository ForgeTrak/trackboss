import {
    DeleteLinkResponse,
    GetLinkResponse,
    Link,
} from '../../../src/typedefs/link';
import { apiRequest } from './utils';

export function getLinks(token: string): Promise<GetLinkResponse> {
    return apiRequest(token, 'GET', '/api/link/list');
}

export function getAllLinks(token: string): Promise<GetLinkResponse> {
    return apiRequest(token, 'GET', '/api/link/all');
}

export function deleteLink(token: string, id: number): Promise<DeleteLinkResponse> {
    return apiRequest(token, 'DELETE', `/api/link/${id}`);
}

export function updateLink(token: string, link: Link): Promise<GetLinkResponse> {
    return apiRequest(token, 'PATCH', `/api/link/${link.linkId}`, link);
}

export function createLink(token: string, link: Link): Promise<Link> {
    return apiRequest(token, 'POST', '/api/link', link);
}
