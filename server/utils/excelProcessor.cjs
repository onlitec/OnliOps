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
                if (ExcelProcessor.HEADER_KEYWORDS.some(kw => ip.toLowerCase() === kw)) {
                    errors.push(`"${ip}" parece ser um título de coluna, não um IP`);
                } else {
                    errors.push(`Formato de IP inválido: ${ip}`);
                }
            }
        }

        // Serial validation - check if it looks like a header
        // But allow real device serials that might contain keywords
        if (serial) {
            const serialLower = serial.toLowerCase();

            // Patterns that indicate a REAL device serial (not a header)
            const deviceSerialPatterns = [
                /^ds-/i,        // Hikvision
                /^ipc-/i,       // HiLook/Dahua
                /^dh-/i,        // Dahua
                /^vip-/i,       // Intelbras
                /^vhd-/i,       // Intelbras
                /^axis/i,       // Axis
                /^\d{10,}/,     // Long numeric (10+ digits)
                /^[a-z0-9]{15,}$/i  // Long alphanumeric (15+ chars) = likely a serial
            ];

            const isRealSerial = deviceSerialPatterns.some(pattern => pattern.test(serial));

            // Only flag as header if it's a short string matching header keywords exactly
            if (!isRealSerial && serial.length < 15) {
                if (ExcelProcessor.HEADER_KEYWORDS.some(kw => serialLower === kw)) {
                    errors.push(`"${serial}" parece ser um título de coluna, não um serial`);
                }
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

    /**
     * Detect if a value looks like a malformed IP (numeric without dots)
     * @param {string|number} value - The value to check
     * @returns {boolean}
     */
    detectMalformedIP(value) {
        if (value === null || value === undefined) return false;

        const str = String(value).trim();

        // Must be numeric only (3-12 digits that could represent an IP)
        if (!/^\d{1,12}$/.test(str)) return false;

        // If it already has dots and is a valid IP, it's not malformed
        if (ExcelProcessor.DATA_PATTERNS.ip.test(str)) return false;

        // Numbers between 1 and 255 could be just host parts - too ambiguous
        const num = parseInt(str, 10);
        if (num >= 0 && num <= 255 && str.length <= 3) {
            // Could be just a host number, flag as potentially malformed
            return true;
        }

        // Numbers with 4+ digits that look like compressed IPs
        if (str.length >= 4) {
            return true;
        }

        return false;
    }

    /**
     * Analyze a dataset for malformed IPs
     * @param {Array} devices - Array of device objects
     * @returns {Object} Analysis result with malformed IPs
     */
    analyzeMalformedIPs(devices) {
        const malformed = [];
        const valid = [];
        const samples = {};

        devices.forEach((device, index) => {
            const ipValue = device.ip_address;
            if (!ipValue) return;

            const str = String(ipValue).trim();

            if (this.detectMalformedIP(str)) {
                malformed.push({
                    index,
                    original: str,
                    device
                });
                // Collect samples for pattern detection
                if (!samples[str.length]) {
                    samples[str.length] = [];
                }
                if (samples[str.length].length < 5) {
                    samples[str.length].push(str);
                }
            } else if (ExcelProcessor.DATA_PATTERNS.ip.test(str)) {
                valid.push(str);
            }
        });

        // Try to detect network prefix from valid IPs
        let detectedPrefix = null;
        if (valid.length > 0) {
            const prefixes = valid.map(ip => {
                const parts = ip.split('.');
                return `${parts[0]}.${parts[1]}.${parts[2]}`;
            });
            const prefixCounts = {};
            prefixes.forEach(p => {
                prefixCounts[p] = (prefixCounts[p] || 0) + 1;
            });
            const sorted = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1]);
            if (sorted.length > 0 && sorted[0][1] >= valid.length * 0.5) {
                detectedPrefix = sorted[0][0];
            }
        }

        return {
            hasMalformed: malformed.length > 0,
            malformedCount: malformed.length,
            validCount: valid.length,
            malformedDevices: malformed,
            samples,
            detectedPrefix,
            suggestedAction: malformed.length > 0
                ? (detectedPrefix ? 'use_detected_prefix' : 'request_prefix')
                : 'none'
        };
    }

    /**
     * Suggest IP corrections based on network prefix
     * @param {string} malformedIP - The malformed IP value
     * @param {string} networkPrefix - Network prefix (e.g., "10.0.0" or "192.168.1")
     * @param {string} strategy - Correction strategy ('last_digits' or 'split_octets')
     * @returns {Array} Array of suggested corrections
     */
    suggestIPCorrection(malformedIP, networkPrefix, strategy = 'last_digits') {
        const str = String(malformedIP).trim();
        const suggestions = [];

        if (!networkPrefix) {
            return suggestions;
        }

        const prefixParts = networkPrefix.split('.').filter(p => p !== '');

        if (strategy === 'last_digits') {
            // Use last 1-3 digits as host part
            for (let digits = 1; digits <= Math.min(3, str.length); digits++) {
                const hostStr = str.slice(-digits);
                const hostNum = parseInt(hostStr, 10);

                if (hostNum >= 0 && hostNum <= 255) {
                    // Build the full IP
                    let fullIP;
                    if (prefixParts.length === 3) {
                        fullIP = `${prefixParts.join('.')}.${hostNum}`;
                    } else if (prefixParts.length === 2) {
                        // Need to figure out third octet
                        const remaining = str.slice(0, -digits);
                        const thirdOctet = remaining ? parseInt(remaining, 10) % 256 : 0;
                        fullIP = `${prefixParts.join('.')}.${thirdOctet}.${hostNum}`;
                    } else {
                        continue;
                    }

                    // Validate the generated IP
                    if (ExcelProcessor.DATA_PATTERNS.ip.test(fullIP)) {
                        suggestions.push({
                            ip: fullIP,
                            confidence: digits === str.length ? 'high' : (digits >= 2 ? 'medium' : 'low'),
                            method: `${networkPrefix}.x + últimos ${digits} dígitos`,
                            hostDigits: digits
                        });
                    }
                }
            }
        } else if (strategy === 'split_octets') {
            // Try to intelligently split the number into octets
            // For numbers like 10003 -> could be 10.0.0.3
            const patterns = this.trySplitIntoOctets(str);
            patterns.forEach(pattern => {
                if (ExcelProcessor.DATA_PATTERNS.ip.test(pattern.ip)) {
                    suggestions.push({
                        ip: pattern.ip,
                        confidence: pattern.confidence,
                        method: 'divisão automática em octetos',
                        hostDigits: null
                    });
                }
            });
        }

        // Sort by confidence
        const order = { high: 0, medium: 1, low: 2 };
        suggestions.sort((a, b) => order[a.confidence] - order[b.confidence]);

        return suggestions;
    }

    /**
     * Try to split a numeric string into IP octets
     * @param {string} str - Numeric string
     * @returns {Array} Possible IP patterns
     */
    trySplitIntoOctets(str) {
        const results = [];
        const n = str.length;

        // Try different split positions
        // For a 4-digit number like "1003": could be 1.0.0.3, 10.0.3, 100.3
        for (let i = 1; i <= Math.min(3, n - 1); i++) {
            for (let j = i + 1; j <= Math.min(i + 3, n - 1); j++) {
                for (let k = j + 1; k <= Math.min(j + 3, n); k++) {
                    const a = str.slice(0, i);
                    const b = str.slice(i, j);
                    const c = str.slice(j, k);
                    const d = str.slice(k);

                    if (d.length === 0 || d.length > 3) continue;

                    const octets = [a, b, c, d].map(o => parseInt(o, 10));

                    if (octets.every(o => o >= 0 && o <= 255)) {
                        const ip = octets.join('.');
                        // Determine confidence based on common patterns
                        let confidence = 'low';
                        if (octets[0] === 10 || octets[0] === 192 || octets[0] === 172) {
                            confidence = 'medium';
                        }
                        if (octets[0] === 10 && octets[1] === 0 && octets[2] === 0) {
                            confidence = 'high';
                        }

                        results.push({ ip, confidence });
                    }
                }
            }
        }

        return results;
    }

    /**
     * Apply IP corrections to a list of devices
     * @param {Array} devices - Array of device objects
     * @param {string} networkPrefix - Network prefix to use
     * @param {number} hostDigits - Number of digits to use as host (1-3)
     * @returns {Object} Corrected devices and stats
     */
    applyIPCorrections(devices, networkPrefix, hostDigits = 3) {
        const corrected = [];
        const stats = {
            total: devices.length,
            corrected: 0,
            failed: 0,
            unchanged: 0
        };

        devices.forEach(device => {
            const ipValue = device.ip_address;

            if (!ipValue) {
                corrected.push({ ...device, _ipCorrected: false });
                stats.unchanged++;
                return;
            }

            const str = String(ipValue).trim();

            // If already valid, keep it
            if (ExcelProcessor.DATA_PATTERNS.ip.test(str)) {
                corrected.push({ ...device, _ipCorrected: false });
                stats.unchanged++;
                return;
            }

            // Try to correct
            if (this.detectMalformedIP(str)) {
                const suggestions = this.suggestIPCorrection(str, networkPrefix, 'last_digits');

                // Find the best suggestion matching the requested hostDigits
                let bestSuggestion = suggestions.find(s => s.hostDigits === hostDigits);
                if (!bestSuggestion && suggestions.length > 0) {
                    bestSuggestion = suggestions[0]; // Use highest confidence
                }

                if (bestSuggestion) {
                    corrected.push({
                        ...device,
                        ip_address: bestSuggestion.ip,
                        _ipCorrected: true,
                        _originalIP: str,
                        _correctionMethod: bestSuggestion.method,
                        _correctionConfidence: bestSuggestion.confidence
                    });
                    stats.corrected++;
                } else {
                    corrected.push({
                        ...device,
                        _ipCorrected: false,
                        _ipError: 'Não foi possível corrigir o IP'
                    });
                    stats.failed++;
                }
            } else {
                corrected.push({ ...device, _ipCorrected: false });
                stats.unchanged++;
            }
        });

        return { devices: corrected, stats };
    }
}

module.exports = new ExcelProcessor();

