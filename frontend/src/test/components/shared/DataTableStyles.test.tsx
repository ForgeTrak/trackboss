import { describe, it, expect } from 'vitest';
import dataTableStyles from '../../../components/shared/DataTableStyles';

describe('DataTableStyles', () => {
    it('returns the correct styles object', () => {
        const styles = dataTableStyles();

        expect(styles).toHaveProperty('headCells');
        expect(styles).toHaveProperty('cells');
    });

    it('headCells has correct style properties', () => {
        const styles = dataTableStyles();

        expect(styles.headCells).toHaveProperty('style');
        expect(styles.headCells.style).toEqual({
            paddingTop: '0',
            fontSize: '1.5em',
            backgroundColor: '#f9f9f9',
            color: '#626262',
        });
    });

    it('cells has correct style properties', () => {
        const styles = dataTableStyles();

        expect(styles.cells).toHaveProperty('style');
        expect(styles.cells.style).toEqual({
            fontSize: '1.2em',
        });
    });

    it('returns consistent styles on multiple calls', () => {
        const styles1 = dataTableStyles();
        const styles2 = dataTableStyles();

        expect(styles1).toEqual(styles2);
    });

    it('headCells style includes all expected properties', () => {
        const styles = dataTableStyles();
        const headCellStyle = styles.headCells.style;

        expect(headCellStyle).toHaveProperty('paddingTop', '0');
        expect(headCellStyle).toHaveProperty('fontSize', '1.5em');
        expect(headCellStyle).toHaveProperty('backgroundColor', '#f9f9f9');
        expect(headCellStyle).toHaveProperty('color', '#626262');
    });

    it('cells style includes all expected properties', () => {
        const styles = dataTableStyles();
        const cellStyle = styles.cells.style;

        expect(cellStyle).toHaveProperty('fontSize', '1.2em');
    });
});
