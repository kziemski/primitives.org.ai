/**
 * Google Sheets Provider
 *
 * Concrete implementation of SpreadsheetProvider using Google Sheets API.
 *
 * @packageDocumentation
 */
import { defineProvider } from '../registry.js';
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
/**
 * Google Sheets provider info
 */
export const googleSheetsInfo = {
    id: 'spreadsheet.google-sheets',
    name: 'Google Sheets',
    description: 'Google Sheets cloud spreadsheet service',
    category: 'spreadsheet',
    website: 'https://sheets.google.com',
    docsUrl: 'https://developers.google.com/sheets/api',
    requiredConfig: ['accessToken'],
    optionalConfig: ['refreshToken', 'clientId', 'clientSecret'],
};
/**
 * Create Google Sheets provider
 */
export function createGoogleSheetsProvider(config) {
    let accessToken;
    async function sheetsApi(path, method = 'GET', body, baseUrl = SHEETS_API_URL) {
        const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error?.error?.message || `HTTP ${response.status}`);
        }
        return response.json();
    }
    return {
        info: googleSheetsInfo,
        async initialize(cfg) {
            accessToken = cfg.accessToken;
            if (!accessToken) {
                throw new Error('Google Sheets access token is required');
            }
        },
        async healthCheck() {
            const start = Date.now();
            try {
                // Test with a minimal API call
                await sheetsApi('', 'GET', undefined, 'https://www.googleapis.com/oauth2/v1/tokeninfo');
                return {
                    healthy: true,
                    latencyMs: Date.now() - start,
                    message: 'Connected',
                    checkedAt: new Date(),
                };
            }
            catch (error) {
                return {
                    healthy: false,
                    latencyMs: Date.now() - start,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    checkedAt: new Date(),
                };
            }
        },
        async dispose() {
            // No cleanup needed
        },
        async create(name, options) {
            const sheets = options?.sheets || [{ name: 'Sheet1' }];
            const body = {
                properties: {
                    title: name,
                    locale: options?.locale,
                    timeZone: options?.timeZone,
                },
                sheets: sheets.map((s, index) => ({
                    properties: {
                        title: s.name,
                        index,
                    },
                })),
            };
            const data = await sheetsApi('', 'POST', body);
            return mapSpreadsheet(data);
        },
        async get(spreadsheetId) {
            try {
                const data = await sheetsApi(`/${spreadsheetId}?includeGridData=false`);
                return mapSpreadsheet(data);
            }
            catch {
                return null;
            }
        },
        async list(options) {
            const params = new URLSearchParams({
                q: `mimeType='application/vnd.google-apps.spreadsheet'${options?.query ? ` and name contains '${options.query}'` : ''}`,
                pageSize: (options?.limit || 100).toString(),
                fields: 'files(id,name,createdTime,modifiedTime),nextPageToken',
            });
            if (options?.cursor) {
                params.append('pageToken', options.cursor);
            }
            const data = await sheetsApi(`?${params.toString()}`, 'GET', undefined, DRIVE_API_URL);
            return {
                items: data.files?.map((f) => ({
                    id: f.id,
                    name: f.name,
                    sheets: [], // Would need separate API call to get sheets
                    createdAt: f.createdTime ? new Date(f.createdTime) : undefined,
                    modifiedAt: f.modifiedTime ? new Date(f.modifiedTime) : undefined,
                    url: `https://docs.google.com/spreadsheets/d/${f.id}`,
                })) || [],
                hasMore: !!data.nextPageToken,
                nextCursor: data.nextPageToken,
            };
        },
        async delete(spreadsheetId) {
            try {
                await sheetsApi(`/${spreadsheetId}`, 'DELETE', undefined, DRIVE_API_URL);
                return true;
            }
            catch {
                return false;
            }
        },
        async getSheet(spreadsheetId, sheetId) {
            try {
                const spreadsheet = await sheetsApi(`/${spreadsheetId}?includeGridData=true`);
                const sheet = typeof sheetId === 'number'
                    ? spreadsheet.sheets.find((s) => s.properties.sheetId === sheetId)
                    : spreadsheet.sheets.find((s) => s.properties.title === sheetId);
                if (!sheet)
                    return null;
                // Extract data from grid
                const gridData = sheet.data?.[0];
                const data = [];
                if (gridData?.rowData) {
                    for (const row of gridData.rowData) {
                        const rowValues = [];
                        if (row.values) {
                            for (const cell of row.values) {
                                rowValues.push(extractCellValue(cell));
                            }
                        }
                        data.push(rowValues);
                    }
                }
                return {
                    id: sheet.properties.sheetId.toString(),
                    name: sheet.properties.title,
                    index: sheet.properties.index,
                    rowCount: sheet.properties.gridProperties?.rowCount || 0,
                    columnCount: sheet.properties.gridProperties?.columnCount || 0,
                    data,
                    frozenRows: sheet.properties.gridProperties?.frozenRowCount,
                    frozenColumns: sheet.properties.gridProperties?.frozenColumnCount,
                };
            }
            catch {
                return null;
            }
        },
        async addSheet(spreadsheetId, name, options) {
            const body = {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: name,
                                index: options?.index,
                                gridProperties: {
                                    rowCount: options?.rowCount || 1000,
                                    columnCount: options?.columnCount || 26,
                                },
                            },
                        },
                    },
                ],
            };
            const data = await sheetsApi(`/${spreadsheetId}:batchUpdate`, 'POST', body);
            const reply = data.replies[0].addSheet;
            return {
                id: reply.properties.sheetId.toString(),
                name: reply.properties.title,
                index: reply.properties.index,
                rowCount: reply.properties.gridProperties?.rowCount || 0,
                columnCount: reply.properties.gridProperties?.columnCount || 0,
            };
        },
        async deleteSheet(spreadsheetId, sheetId) {
            try {
                // If sheetId is a string (name), we need to look up the actual sheet ID
                let actualSheetId = typeof sheetId === 'number' ? sheetId : parseInt(sheetId, 10);
                if (isNaN(actualSheetId)) {
                    // Look up by name
                    const spreadsheet = await sheetsApi(`/${spreadsheetId}`);
                    const sheet = spreadsheet.sheets.find((s) => s.properties.title === sheetId);
                    if (!sheet)
                        return false;
                    actualSheetId = sheet.properties.sheetId;
                }
                const body = {
                    requests: [
                        {
                            deleteSheet: {
                                sheetId: actualSheetId,
                            },
                        },
                    ],
                };
                await sheetsApi(`/${spreadsheetId}:batchUpdate`, 'POST', body);
                return true;
            }
            catch {
                return false;
            }
        },
        async renameSheet(spreadsheetId, sheetId, name) {
            try {
                let actualSheetId = typeof sheetId === 'number' ? sheetId : parseInt(sheetId, 10);
                if (isNaN(actualSheetId)) {
                    const spreadsheet = await sheetsApi(`/${spreadsheetId}`);
                    const sheet = spreadsheet.sheets.find((s) => s.properties.title === sheetId);
                    if (!sheet)
                        return false;
                    actualSheetId = sheet.properties.sheetId;
                }
                const body = {
                    requests: [
                        {
                            updateSheetProperties: {
                                properties: {
                                    sheetId: actualSheetId,
                                    title: name,
                                },
                                fields: 'title',
                            },
                        },
                    ],
                };
                await sheetsApi(`/${spreadsheetId}:batchUpdate`, 'POST', body);
                return true;
            }
            catch {
                return false;
            }
        },
        async readRange(spreadsheetId, range) {
            const data = await sheetsApi(`/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`);
            return data.values || [];
        },
        async writeRange(spreadsheetId, range, values) {
            const body = {
                values,
            };
            const data = await sheetsApi(`/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, 'PUT', body);
            return {
                updatedRange: data.updatedRange,
                updatedRows: data.updatedRows || 0,
                updatedColumns: data.updatedColumns || 0,
                updatedCells: data.updatedCells || 0,
            };
        },
        async appendRows(spreadsheetId, range, values) {
            const body = {
                values,
            };
            const data = await sheetsApi(`/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, 'POST', body);
            return {
                spreadsheetId: data.spreadsheetId,
                updatedRange: data.updates?.updatedRange || range,
                updatedRows: data.updates?.updatedRows || values.length,
            };
        },
        async clearRange(spreadsheetId, range) {
            try {
                await sheetsApi(`/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, 'POST', {});
                return true;
            }
            catch {
                return false;
            }
        },
        async batchRead(spreadsheetId, ranges) {
            const params = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
            const data = await sheetsApi(`/${spreadsheetId}/values:batchGet?${params}&valueRenderOption=UNFORMATTED_VALUE`);
            const result = new Map();
            data.valueRanges?.forEach((vr) => {
                result.set(vr.range, vr.values || []);
            });
            return result;
        },
        async batchWrite(spreadsheetId, data) {
            const body = {
                valueInputOption: 'USER_ENTERED',
                data: data.map((d) => ({
                    range: d.range,
                    values: d.values,
                })),
            };
            const response = await sheetsApi(`/${spreadsheetId}/values:batchUpdate`, 'POST', body);
            return {
                updatedRange: 'batch',
                updatedRows: response.totalUpdatedRows || 0,
                updatedColumns: response.totalUpdatedColumns || 0,
                updatedCells: response.totalUpdatedCells || 0,
            };
        },
        async export(spreadsheetId, format) {
            const mimeTypes = {
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                csv: 'text/csv',
                pdf: 'application/pdf',
            };
            const response = await fetch(`${DRIVE_API_URL}/${spreadsheetId}/export?mimeType=${encodeURIComponent(mimeTypes[format])}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Export failed: HTTP ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        },
    };
}
function mapSpreadsheet(data) {
    return {
        id: data.spreadsheetId,
        name: data.properties.title,
        sheets: data.sheets?.map((s) => ({
            id: s.properties.sheetId.toString(),
            name: s.properties.title,
            index: s.properties.index,
            rowCount: s.properties.gridProperties?.rowCount,
            columnCount: s.properties.gridProperties?.columnCount,
        })) || [],
        createdAt: undefined, // Not available from Sheets API
        modifiedAt: undefined,
        url: data.spreadsheetUrl,
    };
}
function extractCellValue(cell) {
    if (!cell)
        return null;
    const ev = cell.effectiveValue;
    if (!ev)
        return null;
    if ('numberValue' in ev)
        return ev.numberValue;
    if ('stringValue' in ev)
        return ev.stringValue;
    if ('boolValue' in ev)
        return ev.boolValue;
    if ('formulaValue' in ev)
        return ev.formulaValue;
    if ('errorValue' in ev)
        return `#ERROR: ${ev.errorValue.message}`;
    return null;
}
/**
 * Google Sheets provider definition
 */
export const googleSheetsProvider = defineProvider(googleSheetsInfo, async (config) => createGoogleSheetsProvider(config));
