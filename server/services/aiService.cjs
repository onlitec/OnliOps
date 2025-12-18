/**
 * AI Service Module
 * Connects to local Ollama instance for device categorization and intelligent analysis
 */

const axios = require('axios');
const promptLoader = require('../prompts/index.cjs');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.AI_MODEL || 'phi3';

class AIService {
    constructor() {
        this.ollamaUrl = OLLAMA_URL;
        this.model = DEFAULT_MODEL;
        this.promptLoader = promptLoader;
    }

    /**
     * Check if Ollama is available
     */
    async isAvailable() {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            console.error('Ollama not available:', error.message);
            return false;
        }
    }

    /**
     * Get list of available models
     */
    async getModels() {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`);
            return response.data.models || [];
        } catch (error) {
            console.error('Error fetching models:', error.message);
            return [];
        }
    }

    /**
     * Send a prompt to the AI and get a response
     */
    async chat(prompt, options = {}) {
        try {
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: options.model || this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.3,
                    num_predict: options.maxTokens || 2048,
                }
            }, {
                timeout: 120000 // 2 minutes timeout for generation
            });

            return {
                success: true,
                response: response.data.response,
                model: response.data.model,
                totalDuration: response.data.total_duration
            };
        } catch (error) {
            console.error('AI chat error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stream AI response token by token
     * @param {string} prompt - The prompt to send
     * @param {Object} options - Options (model, temperature, maxTokens)
     * @param {Function} onToken - Callback called for each token received
     * @returns {Promise<Object>} Final result with full response
     */
    async chatStream(prompt, options = {}, onToken = () => { }) {
        const http = require('http');
        const https = require('https');

        return new Promise((resolve, reject) => {
            const url = new URL(`${this.ollamaUrl}/api/generate`);
            const isHttps = url.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const postData = JSON.stringify({
                model: options.model || this.model,
                prompt: prompt,
                stream: true,
                options: {
                    temperature: options.temperature || 0.3,
                    num_predict: options.maxTokens || 2048,
                }
            });

            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 120000
            };

            let fullResponse = '';
            let model = '';

            const req = httpModule.request(requestOptions, (res) => {
                res.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);

                            if (data.response) {
                                fullResponse += data.response;
                                onToken(data.response, {
                                    done: data.done || false,
                                    context: data.context
                                });
                            }

                            if (data.model) {
                                model = data.model;
                            }

                            if (data.done) {
                                resolve({
                                    success: true,
                                    response: fullResponse,
                                    model: model,
                                    totalDuration: data.total_duration
                                });
                            }
                        } catch (e) {
                            // Skip malformed JSON lines
                        }
                    }
                });

                res.on('error', (error) => {
                    reject({ success: false, error: error.message });
                });
            });

            req.on('error', (error) => {
                console.error('Stream request error:', error.message);
                reject({ success: false, error: error.message });
            });

            req.on('timeout', () => {
                req.destroy();
                reject({ success: false, error: 'Request timeout' });
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Analyze devices and categorize them using saved prompt
     * @param {Array} devices - Array of device objects with model, manufacturer, description fields
     * @param {Array} categories - Available categories from database
     */
    async categorizeDevices(devices, categories) {
        const categoryList = categories.map(c => `- ${c.slug}: ${c.name}`).join('\n');

        // Load the saved prompt from file
        const prompt = this.promptLoader.getPrompt('categorize_devices', {
            categories: categoryList,
            devices: devices.slice(0, 50)
        });

        if (!prompt) {
            console.error('Failed to load categorize_devices prompt, using fallback');
            // Fallback to basic prompt if file not found
            return this._categorizeDevicesFallback(devices, categories);
        }

        const result = await this.chat(prompt.content, {
            temperature: prompt.temperature,
            maxTokens: prompt.maxTokens
        });

        if (!result.success) {
            return { success: false, error: result.error };
        }

        try {
            // Try to extract JSON from the response
            let jsonStr = result.response.trim();

            // Handle if response is wrapped in markdown code blocks
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            // Try to find JSON array
            const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            }

            const categorizations = JSON.parse(jsonStr);
            return {
                success: true,
                categorizations,
                model: result.model
            };
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError.message);
            console.error('Raw response:', result.response);
            return {
                success: false,
                error: 'Failed to parse AI response',
                rawResponse: result.response
            };
        }
    }

    /**
     * Fallback categorization if prompt file not available
     */
    async _categorizeDevicesFallback(devices, categories) {
        const categoryList = categories.map(c => `- ${c.slug}: ${c.name}`).join('\n');
        const fallbackPrompt = `Categorize these devices:\n\nCategories:\n${categoryList}\n\nDevices:\n${JSON.stringify(devices.slice(0, 50))}\n\nReturn JSON array with: original_index, suggested_category, confidence, reason`;

        const result = await this.chat(fallbackPrompt, { temperature: 0.1 });
        if (!result.success) return { success: false, error: result.error };

        try {
            let jsonStr = result.response.trim();
            const match = jsonStr.match(/\[[\s\S]*\]/);
            if (match) jsonStr = match[0];
            return { success: true, categorizations: JSON.parse(jsonStr), model: result.model };
        } catch (e) {
            return { success: false, error: 'Failed to parse response' };
        }
    }

    /**
     * Analyze a spreadsheet and identify device sheets using saved prompt
     * @param {Object} workbookInfo - Information about sheets in the workbook
     */
    async analyzeSpreadsheet(workbookInfo) {
        // Prepare data for prompt template
        const sheetsInfo = workbookInfo.sheets.map(s => `- "${s.name}": ${s.rowCount} rows`).join('\n');
        const headersInfo = Object.entries(workbookInfo.sampleColumns).map(([sheet, cols]) =>
            `"${sheet}": [${cols.map(c => `"${c}"`).join(', ')}]`
        ).join('\n');
        const sampleData = workbookInfo.sheets.map(s => ({ name: s.name, sample: s.sampleData?.slice(0, 2) }));

        // Load the saved prompt from file
        const prompt = this.promptLoader.getPrompt('analyze_spreadsheet', {
            sheets: sheetsInfo,
            headers: headersInfo,
            sample_data: JSON.stringify(sampleData, null, 2)
        });

        if (!prompt) {
            console.error('Failed to load analyze_spreadsheet prompt, using fallback');
            return this._analyzeSpreadsheetFallback(workbookInfo);
        }

        const result = await this.chat(prompt.content, {
            temperature: prompt.temperature,
            maxTokens: prompt.maxTokens
        });

        if (!result.success) {
            return { success: false, error: result.error };
        }

        try {
            let jsonStr = result.response.trim();
            // Remove markdown code blocks if present
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }
            // Also try to find JSON object directly
            const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                jsonStr = objectMatch[0];
            }

            const analysis = JSON.parse(jsonStr);
            return {
                success: true,
                analysis,
                model: result.model
            };
        } catch (parseError) {
            console.error('Failed to parse AI spreadsheet analysis:', parseError.message);
            console.log('Raw AI response:', result.response);
            return {
                success: false,
                error: 'Failed to parse AI response',
                rawResponse: result.response
            };
        }
    }

    /**
     * Fallback spreadsheet analysis if prompt file not available
     */
    async _analyzeSpreadsheetFallback(workbookInfo) {
        const fallbackPrompt = `Analyze this spreadsheet and identify device sheets:\n\nSheets: ${JSON.stringify(workbookInfo.sheets.map(s => s.name))}\nColumns: ${JSON.stringify(workbookInfo.sampleColumns)}\n\nReturn JSON with sheets array containing: name, isDeviceSheet, suggestedCategory, columnMapping`;

        const result = await this.chat(fallbackPrompt, { temperature: 0.1 });
        if (!result.success) return { success: false, error: result.error };

        try {
            let jsonStr = result.response.trim();
            const match = jsonStr.match(/\{[\s\S]*\}/);
            if (match) jsonStr = match[0];
            return { success: true, analysis: JSON.parse(jsonStr), model: result.model };
        } catch (e) {
            return { success: false, error: 'Failed to parse response' };
        }
    }

    /**
     * Generate dashboard widget configuration from natural language
     * @param {string} userPrompt - User's request in natural language
     * @param {Object} context - Available data context (categories, metrics, etc.)
     */
    async generateDashboardConfig(userPrompt, context) {
        const prompt = `You are a dashboard configuration assistant for a network monitoring platform.

Available data:
- Categories: ${context.categories?.map(c => c.name).join(', ') || 'cameras, nvrs, switches, routers'}
- Device statuses: active, inactive, maintenance, error
- Available metrics: device_count, alerts, uptime, bandwidth

User request: "${userPrompt}"

Generate a dashboard widget configuration. Available widget types:
- stat_card: Shows a single metric
- chart: Line/bar chart
- table: Data table
- map: Geographic map of devices

Return a JSON object:
{
  "widgets": [
    {
      "type": "widget_type",
      "title": "Widget Title",
      "config": {
        "filters": { "category": "...", "status": "..." },
        "metric": "...",
        "chartType": "line/bar/pie"
      }
    }
  ]
}

Return ONLY the JSON object.`;

        const result = await this.chat(prompt, { temperature: 0.3 });

        if (!result.success) {
            return { success: false, error: result.error };
        }

        try {
            let jsonStr = result.response.trim();
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            const config = JSON.parse(jsonStr);
            return {
                success: true,
                config,
                model: result.model
            };
        } catch (parseError) {
            return {
                success: false,
                error: 'Failed to parse AI response',
                rawResponse: result.response
            };
        }
    }

    /**
     * Identify and analyze Hikvision devices using specialized prompt
     * @param {Array} devices - Array of device objects with model, serial_number fields
     * @returns {Object} Analysis results for each device
     */
    async identifyHikvisionDevices(devices) {
        // Load the specialized Hikvision prompt
        const prompt = this.promptLoader.getPrompt('identify_hikvision', {
            devices: devices.slice(0, 30) // Limit to 30 devices per batch
        });

        if (!prompt) {
            console.error('Failed to load identify_hikvision prompt');
            return { success: false, error: 'Prompt file not found' };
        }

        const result = await this.chat(prompt.content, {
            temperature: prompt.temperature,
            maxTokens: prompt.maxTokens
        });

        if (!result.success) {
            return { success: false, error: result.error };
        }

        try {
            let jsonStr = result.response.trim();

            // Handle markdown code blocks
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            // Try to find JSON array or object
            const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
            const objectMatch = jsonStr.match(/\{[\s\S]*\}/);

            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            } else if (objectMatch) {
                jsonStr = objectMatch[0];
            }

            const analysis = JSON.parse(jsonStr);
            return {
                success: true,
                analysis: Array.isArray(analysis) ? analysis : [analysis],
                model: result.model
            };
        } catch (parseError) {
            console.error('Error parsing Hikvision analysis:', parseError.message);
            return {
                success: false,
                error: 'Failed to parse AI response',
                rawResponse: result.response
            };
        }
    }

    /**
     * Get list of available prompts
     */
    getAvailablePrompts() {
        return this.promptLoader.listPrompts();
    }
}

module.exports = new AIService();

