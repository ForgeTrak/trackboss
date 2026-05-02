import { Workbook, Worksheet } from 'exceljs';
import { Response } from 'express';

export function formatWorkbook(worksheet: Worksheet) {
    // do various formatting things.
    // part one: bold headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { wrapText: true };

    // part 2: stripe rows alternating between white and sliver, and add
    // borders to make it look pretty!
    for (let index = 2; index <= worksheet.rowCount; index++) {
        const currentRow = worksheet.getRow(index);
        currentRow.height = 31;
        let rowColor = 'FFFFFF';
        if (index % 2) {
            rowColor = 'D9D8D8';
        }
        currentRow.alignment = { wrapText: true };
        currentRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowColor },
        };
        currentRow.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    }
}

export function startWorkbook(title: string) {
    // Create workbook and some meta datars about it.
    const workbook = new Workbook();
    workbook.creator = 'Palmyra Racing Association - Track Boss';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet(
        title,
        {
            pageSetup: {
                orientation: 'portrait',
                margins: {
                    left: 0.10,
                    right: 0.10,
                    top: 0.10,
                    bottom: 0.10,
                    header: 0,
                    footer: 0,
                },
            },
        },
    );
    return { workbook, worksheet };
}

export async function httpOutputWorkbook(workbook: Workbook, res: Response, filename: string) {
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    res.send(buffer);
}
