import { ErrorResponse } from './errorResponse';

export type BoardMember = {
    tenantId: string,
    boardId: number,
    title: string,
    titleId: number,
    year: number,
    memberId: number,
    membershipId: number,
    firstName?: string,
    lastName?: string,
    email?: string,
    phone?: string,
}

export type GetBoardMemberRequest = Record<string, never>;

export type GetBoardMemberResponse = BoardMember | ErrorResponse;

export type PostNewBoardMemberRequest = {
    boardMemberTitleId: number,
    tenantId: string,
    year: number,
    memberId: number
}

export type PostNewBoardMemberResponse = BoardMember | ErrorResponse;

export type PatchBoardMemberRequest = {
    tenantId: string,
    boardMemberTitleId?: number,
    year?: number,
    memberId?: number
};

export type PatchBoardMemberResponse = BoardMember | ErrorResponse;

export type GetBoardMemberListRequest = Record<string, never>;

export type GetBoardMemberListResponse = BoardMember[] | ErrorResponse;

export type DeleteBoardMemberRequest = Record<string, never>;

export type DeleteBoardMemberResponse = {
    boardMemberId: number,
} | ErrorResponse;
