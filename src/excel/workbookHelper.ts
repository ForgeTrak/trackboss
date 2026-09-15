import { Response } from 'express';
import writeXlsxFile from 'write-excel-file/node';

export interface WorksheetColumn {
    header: string;
    key: string;
    width?: number;
}

export class Worksheet {
    title: string;
    columns: WorksheetColumn[] = [];
    rows: Record<string, any>[] = [];
    formatted: boolean = false;

    constructor(title: string) {
        this.title = title;
    }

    get rowCount(): number {
        return this.rows.length + 1;
    }

    addRow(row: Record<string, any>) {
        this.rows.push(row);
    }
}

export class Workbook {
    creator: string = 'Palmyra Racing Association - Track Boss';
    created: Date = new Date();
    worksheet?: Worksheet;

    addWorksheet(title: string): Worksheet {
        this.worksheet = new Worksheet(title);
        return this.worksheet;
    }

    async writeBuffer(): Promise<Buffer> {
        if (!this.worksheet) {
            throw new Error('No worksheet found in workbook');
        }
        return generateWorkbookBuffer(this.worksheet);
    }

    get xlsx() {
        return {
            writeBuffer: () => this.writeBuffer(),
        };
    }
}

async function generateWorkbookBuffer(worksheet: Worksheet): Promise<Buffer> {
    const headerRow: any[] = worksheet.columns.map((col) => {
        if (worksheet.formatted) {
            return {
                value: col.header,
                fontWeight: 'bold',
                wrap: true,
            };
        }
        return {
            value: col.header,
        };
    });

    const dataRows: any[][] = worksheet.rows.map((rowObj, rowIdx) => {
        const excelRowIndex = rowIdx + 2;
        const rowColor = (excelRowIndex % 2) ? '#D9D8D8' : '#FFFFFF';

        return worksheet.columns.map((col) => {
            const rawVal = rowObj[col.key];
            let value: any;
            let type: any = String;

            if (typeof rawVal === 'number') {
                type = Number;
                value = rawVal;
            } else if (typeof rawVal === 'boolean') {
                type = Boolean;
                value = rawVal;
            } else if (rawVal instanceof Date) {
                type = Date;
                value = rawVal;
            } else {
                type = String;
                value = rawVal === null || rawVal === undefined ? '' : String(rawVal);
            }

            if (worksheet.formatted) {
                return {
                    value,
                    type,
                    height: 31,
                    wrap: true,
                    backgroundColor: rowColor,
                    borderStyle: 'thin',
                };
            }

            return {
                value,
                type,
            };
        });
    });

    const sheetData = [headerRow, ...dataRows];
    const sanitizedTitle = (worksheet.title || 'Sheet1')
        .replace(/[*?:/\\\[\]]/g, '')
        .slice(0, 31)
        .trim() || 'Sheet1';

    const sheetOptions: any = {
        sheet: sanitizedTitle,
        dateFormat: 'yyyy-mm-dd',
        columns: worksheet.columns.map((col) => (col.width ? { width: col.width } : {})),
    };

    return writeXlsxFile(sheetData, sheetOptions).toBuffer();
}

export function formatWorkbook(worksheet: Worksheet) {
    worksheet.formatted = true;
}

export function startWorkbook(title: string) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(title);
    return { workbook, worksheet };
}

export async function httpOutputWorkbook(workbook: Workbook, res: Response, filename: string) {
    const buffer = await workbook.writeBuffer();
    const cleanFilename = filename.endsWith('.xlsx') ? filename.slice(0, -5) : filename;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${cleanFilename}.xlsx`);
    res.send(buffer);
}

