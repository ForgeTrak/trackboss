import { GetBoardMemberTypeListResponse } from '../../../src/typedefs/boardMemberType';
import {
    GetBoardMemberListResponse,
    PatchBoardMemberRequest,
    PatchBoardMemberResponse,
    PostNewBoardMemberRequest,
    PostNewBoardMemberResponse,
} from '../../../src/typedefs/boardMember';
import { apiRequest } from './utils';

export function getAllBoardMembersForYear(token: string, year: number): Promise<GetBoardMemberListResponse> {
    return apiRequest(token, 'GET', `/api/boardMember/list?year=${year}`);
}

export function getAllBoardMembersForCurrentYear(token: string): Promise<GetBoardMemberListResponse> {
    const currentYear = new Date().getFullYear();
    return apiRequest(token, 'GET', `/api/boardMember/list?year=${currentYear}`);
}

export function getBoardRoles(token: string): Promise<GetBoardMemberTypeListResponse> {
    return apiRequest(token, 'GET', '/api/boardMemberType/list');
}

export function updateBoardMember(
    token: string,
    boardMemberId: number,
    req: PatchBoardMemberRequest,
): Promise<PatchBoardMemberResponse> {
    return apiRequest(token, 'PATCH', `/api/boardMember/${boardMemberId}`, req);
}

export function createBoardMember(
    token: string,
    req: PostNewBoardMemberRequest,
): Promise<PostNewBoardMemberResponse> {
    return apiRequest(token, 'POST', '/api/boardMember/new', req);
}
