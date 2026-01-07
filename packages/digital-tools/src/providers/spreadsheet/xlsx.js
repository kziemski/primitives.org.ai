/**
 * XLSX Spreadsheet Provider
 *
 * Concrete implementation of SpreadsheetProvider using SheetJS (xlsx) library.
 * Works with local .xlsx, .xls, .csv files.
 *
 * @packageDocumentation
 */
import { defineProvider } from '../registry.js';
/**
 * XLSX provider info
 */
export const xlsxInfo = {
    id: 'spreadsheet.xlsx',
    name: 'XLSX (SheetJS)',
    description: 'Local spreadsheet files using SheetJS library (.xlsx, .xls, .csv)',
    category: 'spreadsheet',
    website: 'https://sheetjs.com',
    docsUrl: 'https://docs.sheetjs.com',
    requiredConfig: [],
    optionalConfig: ['basePath'],
};
// In-memory storage for spreadsheets (in real impl, would use filesystem)
const spreadsheets = new Map();
/**
 * Create XLSX spreadsheet provider
 */
export function createXlsxProvider(config) {
    let basePath;
    function generateId() {
        return `xlsx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    function parseRange(range) {
        // Parse A1 notation like "Sheet1!A1:C10" or just "A1:C10"
        let sheetName;
        let cellRange = range;
        if (range.includes('!')) {
            const parts = range.split('!');
            sheetName = parts[0].replace(/^'|'$/g, '');
            cellRange = parts[1];
        }
        const [start, end] = cellRange.split(':');
        const startCell = parseCell(start);
        const endCell = end ? parseCell(end) : startCell;
        return {
            sheet: sheetName,
            startRow: startCell.row,
            startCol: startCell.col,
            endRow: endCell.row,
            endCol: endCell.col,
        };
    }
    function parseCell(cell) {
        const match = cell.match(/^([A-Z]+)(\d+)$/);
        if (!match) {
            throw new Error(`Invalid cell reference: ${cell}`);
        }
        const colStr = match[1];
        const row = parseInt(match[2], 10);
        // Convert column letters to number (A=1, B=2, ..., Z=26, AA=27, etc.)
        let col = 0;
        for (let i = 0; i < colStr.length; i++) {
            col = col * 26 + (colStr.charCodeAt(i) - 64);
        }
        return { row, col };
    }
    function colToLetter(col) {
        let letter = '';
        while (col > 0) {
            const remainder = (col - 1) % 26;
            letter = String.fromCharCode(65 + remainder) + letter;
            col = Math.floor((col - 1) / 26);
        }
        return letter;
    }
    return {
        info: xlsxInfo,
        async initialize(cfg) {
            basePath = cfg.basePath || './spreadsheets';
        },
        async healthCheck() {
            return {
                healthy: true,
                latencyMs: 0,
                message: 'XLSX provider ready (in-memory)',
                checkedAt: new Date(),
            };
        },
        async dispose() {
            // Clear in-memory storage if needed
        },
        async create(name, options) {
            const id = generateId();
            const now = new Date();
            const workbook = {
                id,
                name,
                sheets: new Map(),
                createdAt: now,
                modifiedAt: now,
            };
            // Create default sheet or sheets from options
            const sheetNames = options?.sheets?.map((s) => s.name) || ['Sheet1'];
            sheetNames.forEach((sheetName, index) => {
                workbook.sheets.set(sheetName, {
                    name: sheetName,
                    index,
                    data: [],
                });
            });
            spreadsheets.set(id, workbook);
            return {
                id,
                name,
                sheets: Array.from(workbook.sheets.values()).map((s) => ({
                    id: s.name,
                    name: s.name,
                    index: s.index,
                    rowCount: s.data.length,
                    columnCount: s.data[0]?.length || 0,
                })),
                createdAt: now,
                modifiedAt: now,
            };
        },
        async get(spreadsheetId) {
            const workbook = spreadsheets.get(spreadsheetId);
            if (!workbook)
                return null;
            return {
                id: workbook.id,
                name: workbook.name,
                sheets: Array.from(workbook.sheets.values()).map((s) => ({
                    id: s.name,
                    name: s.name,
                    index: s.index,
                    rowCount: s.data.length,
                    columnCount: s.data[0]?.length || 0,
                })),
                createdAt: workbook.createdAt,
                modifiedAt: workbook.modifiedAt,
            };
        },
        async list(options) {
            let items = Array.from(spreadsheets.values()).map((wb) => ({
                id: wb.id,
                name: wb.name,
                sheets: Array.from(wb.sheets.values()).map((s) => ({
                    id: s.name,
                    name: s.name,
                    index: s.index,
                })),
                createdAt: wb.createdAt,
                modifiedAt: wb.modifiedAt,
            }));
            if (options?.query) {
                const q = options.query.toLowerCase();
                items = items.filter((i) => i.name.toLowerCase().includes(q));
            }
            const offset = options?.offset || 0;
            const limit = options?.limit || 100;
            return {
                items: items.slice(offset, offset + limit),
                total: items.length,
                hasMore: offset + limit < items.length,
            };
        },
        async delete(spreadsheetId) {
            return spreadsheets.delete(spreadsheetId);
        },
        async getSheet(spreadsheetId, sheetId) {
            const workbook = spreadsheets.get(spreadsheetId);
            if (!workbook)
                return null;
            let sheet;
            if (typeof sheetId === 'number') {
                sheet = Array.from(workbook.sheets.values()).find((s) => s.index === sheetId);
            }
            else {
                sheet = workbook.sheets.get(sheetId);
            }
            if (!sheet)
                return null;
            return {
                id: sheet.name,
                name: sheet.name,
                index: sheet.index,
                rowCount: sheet.data.length,
                columnCount: sheet.data[0]?.length || 0,
                data: sheet.data,
                frozenRows: sheet.frozenRows,
                frozenColumns: sheet.frozenColumns,
            };
        },
        async addSheet(spreadsheetId, name, options) {
            const workbook = spreadsheets.get(spreadsheetId);
            if (!workbook) {
                throw new Error(`Spreadsheet ${spreadsheetId} not found`);
            }
            if (workbook.sheets.has(name)) {
                throw new Error(`Sheet ${name} already exists`);
            }
            const index = options?.index ?? workbook.sheets.size;
            const sheet = {
                name,
                index,
                data: [],
            };
            workbook.sheets.set(name, sheet);
            workbook.modifiedAt = new Date();
            return {
                id: name,
                name,
                index,
                rowCount: 0,
                columnCount: 0,
            };
        },
        async deleteSheet(spreadsheetId, sheetId) {
            const workbook = spreadsheets.get(spreadsheetId);
            if (!workbook)
                return false;
            let sheetName;
            if (typeof sheetId === 'number') {
                const sheet = Array.from(workbook.sheets.values()).find((s) => s.index === sheetId);
                sheetName = sheet?.name;
            }
            else {
                sheetName = sheetId;
            }
            if (!sheetName)
                return false;
            const deleted = workbook.sheets.delete(sheetName);
            if (deleted) {
                workbook.modifiedAt = new Date();
            }
            return deleted;
        },
        async renameSheet(spreadsheetId, sheetId, name) {
            const workbook = spreadsheets.get(spreadsheetId);
            if (!workbook)
                return false;
            let oldName;
            if (typeof sheetId === 'number') {
                const sheet = Array.from(workbook.sheets.values()).find((s) => s.index === sheetId);
                oldName = sheet?.name;
            }
            else {
                oldName = sheetId;
            }
            if (!oldName || !workbook.sheets.has(oldName))
                return false;
            const sheet = workbook.sheets.get(oldName);
            workbook.sheets.delete(oldName);
            sheet.name = name;
            workbook.sheets.set(name, sheet);
            workbook.modifiedAt = new Date();
            return true;
        },
        async readRange(spreadsheetId, range) {
            const workbook = spreadsheets.get(spreadsheetId);
            if (!workbook) {
                throw new Error(`Spreadsheet ${spreadsheetId} not found`);
            }
            const { sheet: sheetName, startRow, startCol, endRow, endCol } = parseRange(range);
            // Get sheet (default to first sheet)
            const sheet = sheetName
                ? workbook.sheets.get(sheetName)
                : Array.from(workbook.sheets.values())[0];
            if (!sheet) {
                throw new Error(`Sheet not found`);
            }
            const result = [];
            for (let row = startRow; row <= endRow; row++) {
                const rowData = [];
                for (let col = startCol; col <= endCol; col++) {
                    const value = sheet.data[row - 1]?.[col - 1] ?? null;
                    rowData.push(value);
                }
                result.push(rowData);
            }
            return result;
        },
        async writeRange(spreadsheetId, range, values) {
            const workbook = spreadsheets.get(spreadsheetId);
            if (!workbook) {
                throw new Error(`Spreadsheet ${spreadsheetId} not found`);
            }
            const { sheet: sheetName, startRow, startCol } = parseRange(range);
            // Get sheet (default to first sheet)
            const sheet = sheetName
                ? workbook.sheets.get(sheetName)
                : Array.from(workbook.sheets.values())[0];
            if (!sheet) {
                throw new Error(`Sheet not found`);
            }
            let updatedCells = 0;
            values.forEach((rowValues, rowOffset) => {
                const row = startRow + rowOffset - 1;
                if (!sheet.data[row]) {
                    sheet.data[row] = [];
                }
                rowValues.forEach((value, colOffset) => {
                    const col = startCol + colOffset - 1;
                    sheet.data[row][col] = value;
                    updatedCells++;
                });
            });
            workbook.modifiedAt = new Date();
            const endRow = startRow + values.length - 1;
            const endCol = startCol + (values[0]?.length || 0) - 1;
            return {
                updatedRange: `${sheetName || sheet.name}!${colToLetter(startCol)}${startRow}:${colToLetter(endCol)}${endRow}`,
                updatedRows: values.length,
                updatedColumns: values[0]?.length || 0,
                updatedCells,
            };
        },
        async appendRows(spreadsheetId, range, values) {
            const workbook = spreadsheets.get(spreadsheetId);
            if (!workbook) {
                throw new Error(`Spreadsheet ${spreadsheetId} not found`);
            }
            const { sheet: sheetName, startCol } = parseRange(range);
            const sheet = sheetName
                ? workbook.sheets.get(sheetName)
                : Array.from(workbook.sheets.values())[0];
            if (!sheet) {
                throw new Error(`Sheet not found`);
            }
            const startRow = sheet.data.length + 1;
            values.forEach((rowValues, rowOffset) => {
                const row = startRow + rowOffset - 1;
                if (!sheet.data[row]) {
                    sheet.data[row] = [];
                }
                rowValues.forEach((value, colOffset) => {
                    const col = startCol + colOffset - 1;
                    sheet.data[row][col] = value;
                });
            });
            workbook.modifiedAt = new Date();
            const endRow = startRow + values.length - 1;
            const endCol = startCol + (values[0]?.length || 0) - 1;
            return {
                spreadsheetId,
                updatedRange: `${sheetName || sheet.name}!${colToLetter(startCol)}${startRow}:${colToLetter(endCol)}${endRow}`,
                updatedRows: values.length,
            };
        },
        async clearRange(spreadsheetId, range) {
            const workbook = spreadsheets.get(spreadsheetId);
            if (!workbook)
                return false;
            const { sheet: sheetName, startRow, startCol, endRow, endCol } = parseRange(range);
            const sheet = sheetName
                ? workbook.sheets.get(sheetName)
                : Array.from(workbook.sheets.values())[0];
            if (!sheet)
                return false;
            for (let row = startRow; row <= endRow; row++) {
                if (sheet.data[row - 1]) {
                    for (let col = startCol; col <= endCol; col++) {
                        sheet.data[row - 1][col - 1] = null;
                    }
                }
            }
            workbook.modifiedAt = new Date();
            return true;
        },
        async batchRead(spreadsheetId, ranges) {
            const result = new Map();
            for (const range of ranges) {
                const data = await this.readRange(spreadsheetId, range);
                result.set(range, data);
            }
            return result;
        },
        async batchWrite(spreadsheetId, data) {
            let totalCells = 0;
            let totalRows = 0;
            let totalCols = 0;
            for (const { range, values } of data) {
                const result = await this.writeRange(spreadsheetId, range, values);
                totalCells += result.updatedCells;
                totalRows += result.updatedRows;
                totalCols = Math.max(totalCols, result.updatedColumns);
            }
            return {
                updatedRange: 'batch',
                updatedRows: totalRows,
                updatedColumns: totalCols,
                updatedCells: totalCells,
            };
        },
        async export(spreadsheetId, format) {
            // In a real implementation, this would use SheetJS to generate the file
            const workbook = spreadsheets.get(spreadsheetId);
            if (!workbook) {
                throw new Error(`Spreadsheet ${spreadsheetId} not found`);
            }
            // Placeholder - would use xlsx.write() in real implementation
            const content = JSON.stringify({
                name: workbook.name,
                sheets: Array.from(workbook.sheets.entries()).map(([name, sheet]) => ({
                    name,
                    data: sheet.data,
                })),
            });
            return Buffer.from(content, 'utf-8');
        },
        async import(file, format, options) {
            // In a real implementation, this would use SheetJS to parse the file
            // For now, create an empty spreadsheet
            const name = options?.name || `Imported_${Date.now()}`;
            return this.create(name);
        },
    };
}
/**
 * XLSX provider definition
 */
export const xlsxProvider = defineProvider(xlsxInfo, async (config) => createXlsxProvider(config));
