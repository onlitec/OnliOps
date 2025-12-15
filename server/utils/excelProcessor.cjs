/**
 * Excel Processor Utility
 * Handles parsing of Excel files including multi-sheet workbooks
 * With intelligent header detection and content filtering
 */

const XLSX = require('xlsx');
const path = require('path');

class ExcelProcessor {
    /**
     * Common header keywords that indicate a row is a header
     */
    static HEADER_KEYWORDS = [
        'ip', 'address', 'endereco', 'endereço',
        'serial', 'numero', 'número', 'sn',
        'model', 'modelo', 'type', 'tipo',
        'manufacturer', 'fabricante', 'marca', 'vendor',
        'hostname', 'host', 'name', 'nome', 'device',
        'mac', 'location', 'local', 'site', 'rack',
        'status', 'estado', 'description', 'descricao', 'descrição',
        'tag', 'firmware', 'version', 'versao', 'versão',
        'gateway', 'mascara', 'subnet', 'vlan', 'port', 'porta'
    ];

    /**
     * Patterns that indicate a value is NOT a header (it's actual data)
     */
    static DATA_PATTERNS = {
        // IP address pattern
        ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        // MAC address patterns
        mac: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\.){2}[0-9A-Fa-f]{4}$/,
        // Serial number pattern (alphanumeric, often 10+ chars)
        serial: /^[A-Za-z0-9]{8,}$/,
        // Numeric values (ports, VLANs, etc)
        numeric: /^\d+$/
    };

    /**
     * Detect if a row looks like a header row
     * @param {Array} row - Row data as array
     * @returns {boolean}
     */
    isHeaderRow(row) {
        if (!row || row.length === 0) return false;

        let headerScore = 0;
        let dataScore = 0;
        let totalCells = 0;

        for (const cell of row) {
            if (cell === null || cell === undefined || cell === '') continue;

            const cellStr = String(cell).toLowerCase().trim();
            totalCells++;

            // Check if cell matches header keywords
            for (const keyword of ExcelProcessor.HEADER_KEYWORDS) {
                if (cellStr.includes(keyword) || cellStr === keyword) {
                    headerScore++;
                    break;
                }
            }

            // Check if cell looks like actual data
            if (ExcelProcessor.DATA_PATTERNS.ip.test(cellStr) ||
                ExcelProcessor.DATA_PATTERNS.mac.test(cellStr) ||
                (ExcelProcessor.DATA_PATTERNS.serial.test(cellStr) && cellStr.length > 10)) {
                dataScore++;
            }
        }

        // If more than 30% of non-empty cells are header keywords, it's a header
        // And it doesn't have data-like values
        return totalCells > 0 && headerScore >= Math.ceil(totalCells * 0.3) && dataScore === 0;
    }

    /**
     * Detect if a row looks like actual device data
     * @param {Array} row - Row data as array
     * @returns {boolean}
     */
    isDataRow(row) {
        if (!row || row.length === 0) return false;

        // Check for IP or MAC patterns in any cell
        for (const cell of row) {
            if (cell === null || cell === undefined || cell === '') continue;
            const cellStr = String(cell).trim();

            if (ExcelProcessor.DATA_PATTERNS.ip.test(cellStr) ||
                ExcelProcessor.DATA_PATTERNS.mac.test(cellStr)) {
                return true;
            }
        }

        // Also consider rows with long alphanumeric strings as potential data (serial numbers)
        let hasLongAlphanumeric = false;
        for (const cell of row) {
            if (cell === null || cell === undefined) continue;
            const cellStr = String(cell).trim();
            if (ExcelProcessor.DATA_PATTERNS.serial.test(cellStr) && cellStr.length >= 10) {
                hasLongAlphanumeric = true;
                break;
            }
        }

        return hasLongAlphanumeric;
    }

    /**
     * Find the header row in a sheet automatically
     * @param {Array} data - 2D array of sheet data
     * @returns {Object} { headerRowIndex, headers }
     */
    findHeaderRow(data) {
        // Check first 10 rows for a header
        const maxSearchRows = Math.min(10, data.length);

        for (let i = 0; i < maxSearchRows; i++) {
            if (this.isHeaderRow(data[i])) {
                return {
                    headerRowIndex: i,
                    headers: data[i].map(h => h ? String(h).trim() : '')
                };
            }
        }

        // If no header found, assume first non-empty row is header
        for (let i = 0; i < maxSearchRows; i++) {
            if (data[i] && data[i].some(cell => cell)) {
                return {
                    headerRowIndex: i,
                    headers: data[i].map(h => h ? String(h).trim() : '')
                };
            }
        }

        return { headerRowIndex: 0, headers: [] };
    }

    /**
     * Parse an Excel file and return information about all sheets
     * @param {string} filePath - Path to the Excel file
     */
    parseWorkbook(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);

            const sheetsInfo = workbook.SheetNames.map(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                // Find header row automatically
                const { headerRowIndex, headers } = this.findHeaderRow(data);

                // Get data rows (after header)
                const dataRows = data.slice(headerRowIndex + 1);

                // Filter only rows that look like actual data
                const validDataRows = dataRows.filter(row => {
                    // Skip empty rows
                    if (!row || row.every(cell => !cell)) return false;
                    // Skip rows that look like headers (duplicated headers in middle of sheet)
                    if (this.isHeaderRow(row)) return false;
                    return true;
                });

                // Get row count 
                const rowCount = validDataRows.length;

                // Get sample data (first 3 valid rows)
                const sampleRows = validDataRows.slice(0, 3).map(row => {
                    const obj = {};
                    headers.forEach((header, idx) => {
                        if (header && row[idx] !== undefined && row[idx] !== '') {
                            obj[header] = row[idx];
                        }
                    });
                    return obj;
                });

                return {
                    name: sheetName,
                    headers: headers.filter(h => h), // Remove empty headers
                    headerRowIndex,
                    rowCount,
                    sampleRows
                };
            });

            return {
                success: true,
                fileName: path.basename(filePath),
                sheetCount: workbook.SheetNames.length,
                sheets: sheetsInfo
            };
        } catch (error) {
            console.error('Error parsing workbook:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extract all data from a specific sheet
     * @param {string} filePath - Path to the Excel file
     * @param {string} sheetName - Name of the sheet to extract
     * @param {Object} columnMapping - Mapping of standard fields to sheet columns
     */
    extractSheetData(filePath, sheetName, columnMapping = null) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[sheetName];

            if (!sheet) {
                return {
                    success: false,
                    error: `Sheet "${sheetName}" not found`
                };
            }

            // Get raw data as 2D array
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            // Find header row
            const { headerRowIndex, headers } = this.findHeaderRow(rawData);

            // Get data rows (after header, filter out header-like rows)
            const dataRows = rawData.slice(headerRowIndex + 1).filter(row => {
                if (!row || row.every(cell => !cell)) return false;
                if (this.isHeaderRow(row)) return false;
                return true;
            });

            // Convert to JSON objects
            const jsonData = dataRows.map(row => {
                const obj = {};
                headers.forEach((header, idx) => {
                    if (header && row[idx] !== undefined) {
                        obj[header] = row[idx];
                    }
                });
                return obj;
            });

            // If column mapping provided, transform data
            if (columnMapping) {
                const mappedData = jsonData.map((row, index) => {
                    const mappedRow = { _originalIndex: index };

                    Object.entries(columnMapping).forEach(([standardField, sheetColumn]) => {
                        if (sheetColumn && row[sheetColumn] !== undefined) {
                            // Convert to string and trim
                            let value = row[sheetColumn];
                            if (value !== null && value !== undefined) {
                                value = String(value).trim();
                            }
                            mappedRow[standardField] = value;
                        }
                    });

                    // Keep original data for reference
                    mappedRow._originalData = row;

                    return mappedRow;
                });

                return {
                    success: true,
                    sheetName,
                    data: mappedData,
                    rowCount: mappedData.length,
                    headerRowIndex,
                    headers
                };
            }

            return {
                success: true,
                sheetName,
                data: jsonData,
                rowCount: jsonData.length,
                headerRowIndex,
                headers
            };
        } catch (error) {
            console.error('Error extracting sheet data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Auto-detect column mappings based on common header names
     * Includes support for SADP Hikvision format
     * @param {Array} headers - Array of column headers from the sheet
     */
    autoDetectColumnMapping(headers) {
        const mapping = {
            ip_address: null,
            serial_number: null,
            model: null,
            manufacturer: null,
            hostname: null,
            mac_address: null,
            location: null,
            status: null,
            description: null,
            firmware: null,
            gateway: null,
            subnet_mask: null,
            http_port: null
        };

        const patterns = {
            // IP Address - including SADP format "IPv4 Address"
            ip_address: /^(ip|ip_?address|endereco_?ip|endereço|ip_?addr|ipv4|ip\s*address|ipv4\s*address)$/i,
            // Serial - including SADP format "Device Serial Number"
            serial_number: /^(serial|serial_?number|numero_?serie|número.*serie|sn|s\/n|device\s*serial|device\s*serial\s*number)$/i,
            // Model - including SADP format "Device Type"
            model: /^(model|modelo|model_?name|product|device_?type|device\s*type|tipo|type)$/i,
            // Manufacturer
            manufacturer: /^(manufacturer|fabricante|vendor|marca|brand|make)$/i,
            // Hostname - including SADP "Device Name"
            hostname: /^(hostname|host|name|nome|device_?name|device\s*name|nome_?dispositivo|tag)$/i,
            // MAC Address - SADP uses "MAC Address"
            mac_address: /^(mac|mac_?address|mac\s*address|endereco_?mac|physical.*address)$/i,
            // Location
            location: /^(location|local|localizacao|localização|site|rack|setor|area|área)$/i,
            // Status
            status: /^(status|estado|state|ativo)$/i,
            // Description
            description: /^(description|descricao|descrição|notes|obs|observacao|observação|comments)$/i,
            // Firmware - SADP uses "Software Version"
            firmware: /^(firmware|firmware_?version|software\s*version|software_?version|versao|versão|version)$/i,
            // Gateway - SADP uses "IPv4 Gateway"
            gateway: /^(gateway|ipv4\s*gateway|default\s*gateway|gw)$/i,
            // Subnet Mask
            subnet_mask: /^(subnet|subnet_?mask|mascara|máscara|netmask)$/i,
            // HTTP Port
            http_port: /^(http\s*port|http_?port|port|porta|web\s*port)$/i
        };

        headers.forEach(header => {
            if (!header) return;

            const headerStr = String(header).trim();

            Object.entries(patterns).forEach(([field, pattern]) => {
                if (!mapping[field] && pattern.test(headerStr)) {
                    mapping[field] = header;
                }
            });
        });

        return mapping;
    }

    /**
     * Validate device data before import
     * @param {Object} device - Device data object
     */
    validateDevice(device) {
        const errors = [];
        const warnings = [];

        // Get IP and serial, handling empty strings as null
        const ip = device.ip_address && String(device.ip_address).trim() !== ''
            ? String(device.ip_address).trim()
            : null;
        const serial = device.serial_number && String(device.serial_number).trim() !== ''
            ? String(device.serial_number).trim()
            : null;

        // Required fields - must have at least IP or serial
        if (!ip && !serial) {
            errors.push('Dispositivo deve ter IP ou Número de Série');
        }

        // IP validation
        if (ip) {
            const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            if (!ipPattern.test(ip)) {
                // Check if it looks like a header word
                if (ExcelProcessor.HEADER_KEYWORDS.some(kw => ip.toLowerCase().includes(kw))) {
                    errors.push(`"${ip}" parece ser um título de coluna, não um IP`);
                } else {
                    errors.push(`Formato de IP inválido: ${ip}`);
                }
            }
        }

        // Serial validation - check if it looks like a header
        if (serial) {
            const serialLower = serial.toLowerCase();
            if (ExcelProcessor.HEADER_KEYWORDS.some(kw => serialLower === kw || serialLower.includes(kw))) {
                errors.push(`"${serial}" parece ser um título de coluna, não um serial`);
            }
        }

        // MAC validation (if present)
        if (device.mac_address) {
            const mac = String(device.mac_address).trim();
            if (mac) {
                const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\.){2}[0-9A-Fa-f]{4}$|^[0-9A-Fa-f]{12}$/;
                if (!macPattern.test(mac)) {
                    warnings.push(`MAC pode estar inválido: ${mac}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}

module.exports = new ExcelProcessor();

