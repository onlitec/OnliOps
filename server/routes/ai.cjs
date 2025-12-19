/**
 * AI Routes - API endpoints for AI-powered features
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const aiService = require('../services/aiService.cjs');
const excelProcessor = require('../utils/excelProcessor.cjs');

const router = express.Router();

/**
 * Detect manufacturer from model name or serial number
 * @param {string} model - Device model
 * @param {string} serialNumber - Device serial number
 * @returns {string} Detected manufacturer or 'Unknown'
 */
function detectManufacturer(model, serialNumber) {
    const modelLower = (model || '').toLowerCase();
    const serialLower = (serialNumber || '').toLowerCase();

    // Hikvision patterns
    if (modelLower.startsWith('ds-') ||
        modelLower.includes('hikvision') ||
        serialLower.match(/^ds-/i) ||
        modelLower.match(/^(ds-2cd|ds-2td|ds-7|ds-96|ds-k|ipc-hfw)/i)) {
        return 'Hikvision';
    }

    // Dahua patterns  
    if (modelLower.includes('dahua') ||
        modelLower.startsWith('dh-') ||
        modelLower.match(/^(ipc-hdw|nvr|xvr|dhi-)/i)) {
        return 'Dahua';
    }

    // Intelbras patterns
    if (modelLower.includes('intelbras') ||
        modelLower.match(/^(vip-|vhd-|vhl-|mhdx|nvd|nvr|imhdx)/i)) {
        return 'Intelbras';
    }

    // HiLook (Hikvision sub-brand)
    if (modelLower.includes('hilook') || modelLower.match(/^(ipc-b|ipc-t|nvr-1|dvr-2)/i)) {
        return 'HiLook';
    }

    // Axis
    if (modelLower.includes('axis') || modelLower.match(/^(p|m|q|f)\d{4}/i)) {
        return 'Axis';
    }

    // Cisco
    if (modelLower.includes('cisco') || modelLower.match(/^(ws-|ie-|c9|cat|sg|sf)/i)) {
        return 'Cisco';
    }

    // Ubiquiti
    if (modelLower.includes('ubiquiti') || modelLower.includes('unifi') ||
        modelLower.match(/^(usg|usw|uap|udm|uvc)/i)) {
        return 'Ubiquiti';
    }

    // TP-Link
    if (modelLower.includes('tp-link') || modelLower.match(/^(tl-|archer|deco)/i)) {
        return 'TP-Link';
    }

    // MikroTik
    if (modelLower.includes('mikrotik') || modelLower.includes('routerboard') ||
        modelLower.match(/^(rb|ccr|crs|hex|hap)/i)) {
        return 'MikroTik';
    }

    // Default fallback
    return 'Desconhecido';
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'application/csv',
            'application/octet-stream'
        ];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(file.mimetype) || ['.xlsx', '.xls', '.csv'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) and CSV files (.csv) are allowed'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

/**
 * GET /api/ai/status
 * Check AI service availability
 */
router.get('/status', async (req, res) => {
    try {
        const available = await aiService.isAvailable();
        const models = available ? await aiService.getModels() : [];

        res.json({
            available,
            ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
            models: models.map(m => ({ name: m.name, size: m.size })),
            defaultModel: process.env.AI_MODEL || 'phi3'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/upload
 * Upload and analyze Excel file
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const filePath = req.file.path;

        // Parse the workbook
        const workbookInfo = excelProcessor.parseWorkbook(filePath);

        if (!workbookInfo.success) {
            fs.unlinkSync(filePath); // Clean up
            return res.status(400).json({ error: workbookInfo.error });
        }

        // Prepare info for AI analysis
        const analysisInput = {
            sheets: workbookInfo.sheets.map(s => ({
                name: s.name,
                rowCount: s.rowCount,
                sampleData: s.sampleRows
            })),
            sampleColumns: workbookInfo.sheets.reduce((acc, s) => {
                acc[s.name] = s.headers;
                return acc;
            }, {})
        };

        // Check if AI is available
        const aiAvailable = await aiService.isAvailable();

        let aiAnalysis = null;
        if (aiAvailable) {
            const aiResult = await aiService.analyzeSpreadsheet(analysisInput);
            if (aiResult.success) {
                aiAnalysis = aiResult.analysis;
            }
        }

        // Auto-detect column mappings for each sheet
        const sheetsWithMapping = workbookInfo.sheets.map(sheet => {
            const autoMapping = excelProcessor.autoDetectColumnMapping(sheet.headers);
            const aiSheetInfo = aiAnalysis?.sheets?.find(s => s.name === sheet.name);

            return {
                ...sheet,
                autoMapping,
                aiSuggestion: aiSheetInfo || null,
                isDeviceSheet: aiSheetInfo?.isDeviceSheet ?? (sheet.rowCount > 0 && Object.values(autoMapping).some(v => v !== null))
            };
        });

        // Store file info in session/temp for later use
        const sessionId = req.file.filename.split('-')[0];
        const sessionData = {
            sessionId,
            filePath,
            fileName: req.file.originalname,
            sheets: sheetsWithMapping,
            uploadedAt: new Date().toISOString(),
            projectId: req.projectId
        };

        // Store in a temp file (in production, use Redis or similar)
        const sessionFile = path.join(__dirname, '../uploads', `session-${sessionId}.json`);
        fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

        res.json({
            success: true,
            sessionId,
            fileName: req.file.originalname,
            sheets: sheetsWithMapping,
            aiAvailable,
            aiAnalysis
        });
    } catch (error) {
        console.error('Upload error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/analyze-ips
 * Analyze IPs in uploaded file and detect malformed ones
 */
router.post('/analyze-ips', async (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }

    try {
        // Load session data
        const sessionFile = path.join(__dirname, '../uploads', `session-${sessionId}.json`);
        if (!fs.existsSync(sessionFile)) {
            return res.status(404).json({ error: 'Session not found or expired' });
        }

        const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

        // Extract all devices from all sheets with auto-mapping
        const allDevices = [];

        for (const sheet of sessionData.sheets) {
            if (!sheet.isDeviceSheet) continue;

            const extractResult = excelProcessor.extractSheetData(
                sessionData.filePath,
                sheet.name,
                sheet.autoMapping
            );

            if (extractResult.success) {
                allDevices.push(...extractResult.data);
            }
        }

        // Analyze for malformed IPs
        const analysis = excelProcessor.analyzeMalformedIPs(allDevices);

        res.json({
            success: true,
            sessionId,
            ...analysis
        });
    } catch (error) {
        console.error('IP analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/correct-ips
 * Apply IP corrections based on user-provided network prefix
 */
router.post('/correct-ips', async (req, res) => {
    const { sessionId, networkPrefix, hostDigits, sheetConfigs } = req.body;

    if (!sessionId || !networkPrefix) {
        return res.status(400).json({ error: 'sessionId and networkPrefix are required' });
    }

    try {
        // Load session data
        const sessionFile = path.join(__dirname, '../uploads', `session-${sessionId}.json`);
        if (!fs.existsSync(sessionFile)) {
            return res.status(404).json({ error: 'Session not found or expired' });
        }

        const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

        // Extract devices from selected sheets
        const allDevices = [];

        const configs = sheetConfigs || sessionData.sheets.filter(s => s.isDeviceSheet).map(s => ({
            sheetName: s.name,
            enabled: true,
            columnMapping: s.autoMapping
        }));

        for (const config of configs) {
            if (!config.enabled) continue;

            const extractResult = excelProcessor.extractSheetData(
                sessionData.filePath,
                config.sheetName,
                config.columnMapping
            );

            if (extractResult.success) {
                extractResult.data.forEach(device => {
                    allDevices.push({
                        ...device,
                        _sourceSheet: config.sheetName
                    });
                });
            }
        }

        // Apply IP corrections
        const correctionResult = excelProcessor.applyIPCorrections(
            allDevices,
            networkPrefix,
            hostDigits || 3
        );

        // Update session with corrected data
        sessionData.correctedDevices = correctionResult.devices;
        sessionData.ipCorrectionApplied = true;
        sessionData.ipCorrectionPrefix = networkPrefix;
        fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

        res.json({
            success: true,
            sessionId,
            stats: correctionResult.stats,
            // Return preview of first 20 devices
            preview: correctionResult.devices.slice(0, 20).map(d => ({
                original: d._originalIP || d.ip_address,
                corrected: d._ipCorrected ? d.ip_address : null,
                wasCorrected: d._ipCorrected,
                method: d._correctionMethod,
                confidence: d._correctionConfidence,
                serial: d.serial_number,
                model: d.model
            }))
        });
    } catch (error) {
        console.error('IP correction error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/preview-import
 * Preview devices to be imported with AI categorization
 */
router.post('/preview-import', async (req, res) => {
    const { sessionId, sheetConfigs } = req.body;

    if (!sessionId || !sheetConfigs) {
        return res.status(400).json({ error: 'sessionId and sheetConfigs are required' });
    }

    try {
        // Load session data
        const sessionFile = path.join(__dirname, '../uploads', `session-${sessionId}.json`);
        if (!fs.existsSync(sessionFile)) {
            return res.status(404).json({ error: 'Session not found or expired' });
        }

        const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

        let allDevices = [];

        // Build sheet category map from sheetConfigs
        const sheetCategoryMap = {};
        sheetConfigs.forEach(config => {
            if (config.enabled && config.category) {
                sheetCategoryMap[config.sheetName] = config.category;
            }
        });

        // Use corrected devices if IP correction was applied
        if (sessionData.ipCorrectionApplied && sessionData.correctedDevices) {
            console.log(`Using ${sessionData.correctedDevices.length} corrected devices from session`);

            // Apply categories to corrected devices based on their source sheet
            allDevices = sessionData.correctedDevices.map(device => {
                const categoryFromSheet = sheetCategoryMap[device._sourceSheet];
                return {
                    ...device,
                    _suggestedCategory: categoryFromSheet || device._suggestedCategory || null
                };
            });
        } else {
            // Extract devices from selected sheets
            for (const config of sheetConfigs) {
                if (!config.enabled) continue;

                const extractResult = excelProcessor.extractSheetData(
                    sessionData.filePath,
                    config.sheetName,
                    config.columnMapping
                );

                if (extractResult.success) {
                    extractResult.data.forEach(device => {
                        allDevices.push({
                            ...device,
                            _sourceSheet: config.sheetName,
                            _suggestedCategory: config.category || null
                        });
                    });
                }
            }
        }

        // IMPORTANT: Filter out completely empty devices BEFORE validation
        // A device is considered empty if it has no meaningful data in key fields
        const nonEmptyDevices = allDevices.filter(device => {
            const hasIP = device.ip_address && String(device.ip_address).trim() !== '';
            const hasSerial = device.serial_number && String(device.serial_number).trim() !== '';
            const hasMAC = device.mac_address && String(device.mac_address).trim() !== '';
            const hasModel = device.model && String(device.model).trim() !== '';
            const hasHostname = device.hostname && String(device.hostname).trim() !== '';

            // Keep device if it has at least one meaningful field
            return hasIP || hasSerial || hasMAC || hasModel || hasHostname;
        });

        console.log(`Filtered ${allDevices.length - nonEmptyDevices.length} empty rows, ${nonEmptyDevices.length} devices remaining`);

        // Validate devices
        const devicesWithValidation = nonEmptyDevices.map(device => {
            const validation = excelProcessor.validateDevice(device);
            return {
                ...device,
                _validation: validation
            };
        });

        // Get categories from database (passed from main API)
        const categories = req.body.categories || [];

        // If AI is available, categorize devices that don't have a category
        const devicesNeedingCategorization = devicesWithValidation.filter(
            d => !d._suggestedCategory && d._validation.valid
        );

        let aiCategorization = null;
        if (devicesNeedingCategorization.length > 0) {
            const aiAvailable = await aiService.isAvailable();
            if (aiAvailable) {
                console.log(`Categorizing ${devicesNeedingCategorization.length} devices with AI`);
                const catResult = await aiService.categorizeDevices(
                    devicesNeedingCategorization.map(d => ({
                        model: d.model,
                        manufacturer: d.manufacturer,
                        hostname: d.hostname,
                        description: d.description,
                        serial_number: d.serial_number // Pass serial for manufacturer identification
                    })),
                    categories
                );

                if (catResult.success) {
                    aiCategorization = catResult.categorizations;

                    // Apply categorizations AND manufacturer from AI
                    aiCategorization.forEach(cat => {
                        const device = devicesNeedingCategorization[cat.original_index];
                        if (device) {
                            device._suggestedCategory = cat.suggested_category;
                            device._categoryConfidence = cat.confidence;
                            device._categoryReason = cat.reason;

                            // Apply manufacturer from AI if identified and device doesn't have one
                            if (cat.manufacturer && (!device.manufacturer || device.manufacturer.trim() === '')) {
                                device.manufacturer = cat.manufacturer;
                                device._manufacturerFromAI = true;
                            }
                        }
                    });
                }
            }
        }

        res.json({
            success: true,
            sessionId,
            totalDevices: devicesWithValidation.length,
            validDevices: devicesWithValidation.filter(d => d._validation.valid).length,
            invalidDevices: devicesWithValidation.filter(d => !d._validation.valid).length,
            devices: devicesWithValidation,
            aiCategorization: aiCategorization ? true : false,
            filteredEmptyRows: allDevices.length - nonEmptyDevices.length
        });
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/confirm-import
 * Execute the import based on preview
 */
router.post('/confirm-import', async (req, res) => {
    const { sessionId, devices, pool } = req.body;

    if (!sessionId || !devices) {
        return res.status(400).json({ error: 'sessionId and devices are required' });
    }

    // Note: pool should be passed from the main API context
    const dbPool = req.app.locals.pool;
    if (!dbPool) {
        return res.status(500).json({ error: 'Database connection not available' });
    }

    try {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Get default VLAN
        let defaultVlanId = null;
        try {
            const vlanResult = await dbPool.query(
                'SELECT id FROM vlans WHERE project_id = $1 ORDER BY vlan_id ASC LIMIT 1',
                [req.projectId]
            );
            if (vlanResult.rows.length > 0) {
                defaultVlanId = vlanResult.rows[0].id;
            }
        } catch (e) {
            console.error('Error getting VLAN:', e);
        }

        // Get category map (slug -> id)
        const categoryMap = {};
        try {
            const catResult = await dbPool.query('SELECT id, slug FROM device_categories');
            catResult.rows.forEach(row => {
                categoryMap[row.slug] = row.id;
            });
        } catch (e) {
            console.error('Error getting categories:', e);
        }

        for (const device of devices) {
            if (!device._validation?.valid) {
                results.failed++;
                results.errors.push(`${device.serial_number || device.ip_address}: Validation failed`);
                continue;
            }

            try {
                // Resolve category slug to UUID
                let categorySlug = (device._suggestedCategory || device.device_type || 'converter').toLowerCase();

                // Mappings for common term variations
                const typeMappings = {
                    'cameras': 'camera',
                    'switches': 'switch',
                    'routers': 'router',
                    'access points': 'access_point',
                    'access_points': 'access_point',
                    'ap_wifi': 'access_point',
                    'nvrs': 'nvr',
                    'dvr': 'nvr',
                    'server': 'controller',
                    'sensor': 'converter',
                    'other': 'converter'
                };

                if (typeMappings[categorySlug]) {
                    categorySlug = typeMappings[categorySlug];
                }

                // Strict validation against DB allowed types (if check constraint exists)
                // We trust the query to fail if it's really wrong, but let's try to be safe
                const allowedTypes = ['camera', 'nvr', 'switch', 'router', 'firewall', 'access_point', 'reader', 'controller', 'converter'];
                if (!allowedTypes.includes(categorySlug)) {
                    // Try to remove trailing 's' as last resort
                    if (allowedTypes.includes(categorySlug.replace(/s$/, ''))) {
                        categorySlug = categorySlug.replace(/s$/, '');
                    } else {
                        console.warn(`Invalid category slug '${categorySlug}' for device ${device.serial_number}, falling back to 'converter'`);
                        categorySlug = 'converter';
                    }
                }

                // Normalize and validate status
                const allowedStatuses = ['active', 'inactive', 'maintenance', 'error'];
                let deviceStatus = (device.status || 'active').toLowerCase().trim();

                // Map common variations
                const statusMappings = {
                    'ativo': 'active',
                    'ativa': 'active',
                    'inativo': 'inactive',
                    'inativa': 'inactive',
                    'manutenção': 'maintenance',
                    'manutencao': 'maintenance',
                    'erro': 'error',
                    'offline': 'inactive',
                    'online': 'active',
                    'on': 'active',
                    'off': 'inactive',
                    'ok': 'active',
                    'up': 'active',
                    'down': 'inactive'
                };

                if (statusMappings[deviceStatus]) {
                    deviceStatus = statusMappings[deviceStatus];
                }

                // Final validation - default to 'active' if invalid
                if (!allowedStatuses.includes(deviceStatus)) {
                    console.warn(`Invalid status '${device.status}' for device ${device.serial_number}, defaulting to 'active'`);
                    deviceStatus = 'active';
                }

                await dbPool.query(`
                    INSERT INTO network_devices (
                        serial_number, ip_address, mac_address, model, manufacturer,
                        device_type, firmware_version, hostname, status, vlan_id, notes, project_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT (ip_address, project_id) DO UPDATE SET
                        serial_number = EXCLUDED.serial_number,
                        mac_address = EXCLUDED.mac_address,
                        model = EXCLUDED.model,
                        manufacturer = EXCLUDED.manufacturer,
                        device_type = EXCLUDED.device_type,
                        firmware_version = EXCLUDED.firmware_version,
                        hostname = EXCLUDED.hostname,
                        status = EXCLUDED.status,
                        notes = EXCLUDED.notes,
                        updated_at = NOW()
                `, [
                    device.serial_number,
                    device.ip_address,
                    device.mac_address || null,
                    device.model || 'Unknown',
                    // Auto-detect manufacturer if not provided
                    device.manufacturer || detectManufacturer(device.model, device.serial_number),
                    categorySlug,
                    device.firmware_version || null,
                    device.hostname || null,
                    deviceStatus,
                    defaultVlanId,
                    `Importado via IA em ${new Date().toLocaleString('pt-BR')}. ${device._categoryReason || ''}`,
                    req.projectId
                ]);

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push(`${device.serial_number || device.ip_address}: ${error.message}`);
            }
        }

        // Clean up session files
        const sessionFile = path.join(__dirname, '../uploads', `session-${sessionId}.json`);
        if (fs.existsSync(sessionFile)) {
            const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
            if (fs.existsSync(sessionData.filePath)) {
                fs.unlinkSync(sessionData.filePath);
            }
            fs.unlinkSync(sessionFile);
        }

        res.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/check-duplicates
 * Check if devices already exist in database
 */
router.post('/check-duplicates', async (req, res) => {
    const { devices } = req.body;
    const dbPool = req.app.locals.pool;

    if (!devices || !Array.isArray(devices)) {
        return res.status(400).json({ error: 'devices array is required' });
    }

    if (!dbPool) {
        return res.status(500).json({ error: 'Database connection not available' });
    }

    try {
        // Extract IPs and serials to check
        const ips = devices.map(d => d.ip_address).filter(Boolean);
        const serials = devices.map(d => d.serial_number).filter(Boolean);

        if (ips.length === 0 && serials.length === 0) {
            return res.json({
                success: true,
                totalIncoming: devices.length,
                duplicates: 0,
                newDevices: devices.length,
                duplicateDetails: [],
                uniqueDevices: devices
            });
        }

        // Query existing devices
        const existingResult = await dbPool.query(`
            SELECT id, ip_address, serial_number, tag, hostname, model, manufacturer, updated_at
            FROM network_devices 
            WHERE project_id = $1 
              AND (ip_address::text = ANY($2) OR serial_number = ANY($3))
        `, [req.projectId, ips, serials]);

        const existingByIP = new Map();
        const existingBySerial = new Map();
        existingResult.rows.forEach(row => {
            if (row.ip_address) existingByIP.set(row.ip_address, row);
            if (row.serial_number) existingBySerial.set(row.serial_number, row);
        });

        // Mark duplicates
        const duplicates = [];
        const newDevices = [];

        devices.forEach((device, index) => {
            const byIP = existingByIP.get(device.ip_address);
            const bySerial = existingBySerial.get(device.serial_number);
            const existing = byIP || bySerial;

            if (existing) {
                duplicates.push({
                    index,
                    incoming: device,
                    existing: existing,
                    matchedBy: byIP ? 'ip_address' : 'serial_number',
                    action: 'update' // default action
                });
            } else {
                newDevices.push(device);
            }
        });

        res.json({
            success: true,
            totalIncoming: devices.length,
            duplicates: duplicates.length,
            newDevices: newDevices.length,
            duplicateDetails: duplicates,
            uniqueDevices: newDevices
        });
    } catch (error) {
        console.error('Check duplicates error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/chat
 * General AI chat for asking questions about the platform
 */
router.post('/chat', async (req, res) => {
    const { message, context } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const aiAvailable = await aiService.isAvailable();
        if (!aiAvailable) {
            return res.status(503).json({
                error: 'AI service not available',
                suggestion: 'Make sure Ollama is running on the server'
            });
        }

        // Build context-aware prompt
        const systemContext = context ? `
Current context:
- Total devices: ${context.totalDevices || 'unknown'}
- Active alerts: ${context.activeAlerts || 0}
- Categories: ${context.categories?.join(', ') || 'cameras, nvrs, switches'}
` : '';

        const fullPrompt = `You are an AI assistant for the OnliOps network monitoring platform.
${systemContext}

User question: ${message}

Provide a helpful, concise response. If the question is about generating dashboards or reports, 
suggest specific configurations. If asked about devices, reference the available categories.`;

        const result = await aiService.chat(fullPrompt);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({
            success: true,
            response: result.response,
            model: result.model
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/generate-dashboard
 * Generate dashboard configuration from natural language
 */
router.post('/generate-dashboard', async (req, res) => {
    const { prompt, context } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const aiAvailable = await aiService.isAvailable();
        if (!aiAvailable) {
            return res.status(503).json({ error: 'AI service not available' });
        }

        const result = await aiService.generateDashboardConfig(prompt, context || {});

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({
            success: true,
            config: result.config,
            model: result.model
        });
    } catch (error) {
        console.error('Dashboard generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
