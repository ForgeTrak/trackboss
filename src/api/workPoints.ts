import { Request, Response, Router } from 'express';
import { formatWorkbook, httpOutputWorkbook, startWorkbook } from '../excel/workbookHelper';
import { getWorkPointsByMember, getWorkPointsByMembership, getWorkPointsList } from '../database/workPoints';
import { GetMemberWorkPointsResponse, WorkPoints } from '../typedefs/workPoints';
import { checkHeader, verify } from '../util/auth';

const workPoints = Router();

type ParsedInputs = { id: number, year: number };

function parseInputs(idString: string, yearString: string): ParsedInputs {
    const id = Number(idString);
    if (Number.isNaN(id)) {
        throw new Error('not found');
    }

    let year;
    if (typeof yearString !== 'undefined') {
        year = Number(yearString);
        if (Number.isNaN(year)) {
            throw new Error('user input error');
        }
    } else {
        // no query param -> default to current year
        year = new Date().getFullYear();
    }

    return { id, year };
}

workPoints.get('/byMember/:memberID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMemberWorkPointsResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { id, year } = parseInputs(req.params.memberID, req.query.year as string);
            response = await getWorkPointsByMember(id, year);
            res.status(200);
        } catch (e: any) {
            switch (e.message) {
                case 'user input error':
                    res.status(400);
                    response = { reason: 'bad request' };
                    break;
                case 'Authorization Failed':
                    res.status(401);
                    response = { reason: 'not authorized' };
                    break;
                case 'not found':
                    res.status(404);
                    response = { reason: 'not found' };
                    break;
                default:
                    res.status(500);
                    response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

workPoints.get('/byMembership/:membershipID', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMemberWorkPointsResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { id, year } = parseInputs(req.params.membershipID, req.query.year as string);
            response = await getWorkPointsByMembership(id, year);
            res.status(200);
        } catch (e: any) {
            switch (e.message) {
                case 'user input error':
                    res.status(400);
                    response = { reason: 'bad request' };
                    break;
                case 'Authorization Failed':
                    res.status(401);
                    response = { reason: 'not authorized' };
                    break;
                case 'not found':
                    res.status(404);
                    response = { reason: 'not found' };
                    break;
                default:
                    res.status(500);
                    response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

workPoints.get('/list/excel', async (req: Request, res: Response) => {
    const workPointsByMember = await getWorkPointsList() as WorkPoints[];
    const workbookTitle = `PRA members ${new Date().toLocaleDateString().replace(/\//gi, '-')}`;
    const workbook = startWorkbook(workbookTitle);
    const worksheet = workbook.getWorksheet(1);
    worksheet.columns = [
        { header: 'First Name', key: 'firstName', width: 15 },
        { header: 'Last Name', key: 'lastName', width: 10 },
        { header: 'Membership Type', key: 'membershipType', width: 15 },
        { header: 'Points', key: 'points', width: 6 },
    ];
    workPointsByMember.forEach((member) => {
        worksheet.addRow({
            firstName: member.firstName,
            lastName: member.lastName,
            membershipType: member.membershipType,
            points: member.total,
        });
    });
    formatWorkbook(worksheet);
    // write workbook to buffer.
    httpOutputWorkbook(workbook, res, `members${new Date().getTime()}`);
});

export default workPoints;
