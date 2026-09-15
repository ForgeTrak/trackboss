import { Response } from 'express';
import {
    formatWorkbook,
    httpOutputWorkbook,
    startWorkbook,
    Workbook,
    Worksheet,
} from '../../excel/workbookHelper';

describe('workbookHelper', () => {
    describe('startWorkbook', () => {
        it('should initialize a workbook and worksheet with given title', () => {
            const { workbook, worksheet } = startWorkbook('Test Sheet');
            expect(workbook).toBeInstanceOf(Workbook);
            expect(worksheet).toBeInstanceOf(Worksheet);
            expect(worksheet.title).toEqual('Test Sheet');
            expect(workbook.creator).toContain('Track Boss');
            expect(workbook.created).toBeInstanceOf(Date);
        });
    });

    describe('Worksheet', () => {
        it('should compute rowCount including header row', () => {
            const worksheet = new Worksheet('Count Test');
            expect(worksheet.rowCount).toEqual(1);

            worksheet.addRow({ id: 1, name: 'Alice' });
            expect(worksheet.rowCount).toEqual(2);

            worksheet.addRow({ id: 2, name: 'Bob' });
            expect(worksheet.rowCount).toEqual(3);
        });
    });

    describe('formatWorkbook', () => {
        it('should mark the worksheet as formatted', () => {
            const worksheet = new Worksheet('Format Test');
            expect(worksheet.formatted).toBe(false);

            formatWorkbook(worksheet);
            expect(worksheet.formatted).toBe(true);
        });
    });

    describe('Workbook writeBuffer', () => {
        it('should throw an error if workbook has no worksheet', async () => {
            const workbook = new Workbook();
            await expect(workbook.writeBuffer()).rejects.toThrow('No worksheet found in workbook');
        });

        it('should generate a valid xlsx buffer for formatted workbook with varied data types', async () => {
            const { workbook, worksheet } = startWorkbook('Very Long Sheet Title That Exceeds The Thirty One Character Limit');
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Name', key: 'name', width: 20 },
                { header: 'Score', key: 'score', width: 10 },
                { header: 'Active', key: 'active', width: 10 },
                { header: 'Created', key: 'created', width: 15 },
                { header: 'Notes', key: 'notes' },
            ];

            worksheet.addRow({
                id: 1,
                name: 'Alice',
                score: 95.5,
                active: true,
                created: new Date('2026-01-01'),
                notes: null,
            });
            worksheet.addRow({
                id: 2,
                name: 'Bob',
                score: 80,
                active: false,
                created: new Date('2026-02-01'),
                notes: 'Second row (zebra stripe)',
            });

            formatWorkbook(worksheet);

            const buffer = await workbook.writeBuffer();
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);

            // Test xlsx alias compatibility
            const aliasBuffer = await workbook.xlsx.writeBuffer();
            expect(aliasBuffer).toBeInstanceOf(Buffer);
            expect(aliasBuffer.length).toBeGreaterThan(0);
        });

        it('should generate buffer when worksheet is unformatted', async () => {
            const { workbook, worksheet } = startWorkbook('Unformatted Sheet');
            worksheet.columns = [
                { header: 'Title', key: 'title' },
            ];
            worksheet.addRow({ title: 'Item 1' });

            const buffer = await workbook.writeBuffer();
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
        });

        it('should sanitize sheet names containing invalid characters', async () => {
            const { workbook, worksheet } = startWorkbook('Invalid/Sheet*Name?Test[1]:');
            worksheet.columns = [{ header: 'Col', key: 'col' }];
            worksheet.addRow({ col: 'Value' });

            const buffer = await workbook.writeBuffer();
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
        });

        it('should fallback to default sheet name when title is empty', async () => {
            const { workbook, worksheet } = startWorkbook('');
            worksheet.columns = [{ header: 'Col', key: 'col' }];
            worksheet.addRow({ col: 'Value' });

            const buffer = await workbook.writeBuffer();
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
        });
    });

    describe('httpOutputWorkbook', () => {
        let mockRes: Partial<Response>;
        let headers: Record<string, string>;

        beforeEach(() => {
            headers = {};
            mockRes = {
                setHeader: jest.fn((name: string, value: string) => {
                    headers[name] = value;
                    return mockRes as Response;
                }),
                send: jest.fn(),
            };
        });

        it('should set headers and send buffer when filename has no extension', async () => {
            const { workbook, worksheet } = startWorkbook('Export Test');
            worksheet.columns = [{ header: 'Header', key: 'header' }];
            worksheet.addRow({ header: 'Value' });

            await httpOutputWorkbook(workbook, mockRes as Response, 'my-report');

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                'attachment; filename=my-report.xlsx',
            );
            expect(mockRes.send).toHaveBeenCalledWith(expect.any(Buffer));
        });

        it('should handle filenames that already include .xlsx without duplicating it', async () => {
            const { workbook, worksheet } = startWorkbook('Export Test 2');
            worksheet.columns = [{ header: 'Header', key: 'header' }];
            worksheet.addRow({ header: 'Value' });

            await httpOutputWorkbook(workbook, mockRes as Response, 'my-report.xlsx');

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                'attachment; filename=my-report.xlsx',
            );
            expect(mockRes.send).toHaveBeenCalledWith(expect.any(Buffer));
        });
    });
});
