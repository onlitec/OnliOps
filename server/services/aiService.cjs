/**
 * AI Service Module
 * Connects to local Ollama instance for device categorization and intelligent analysis
 */

const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.AI_MODEL || 'phi3';

class AIService {
    constructor() {
        this.ollamaUrl = OLLAMA_URL;
        this.model = DEFAULT_MODEL;
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
     * Analyze devices and categorize them
     * @param {Array} devices - Array of device objects with model, manufacturer, description fields
     * @param {Array} categories - Available categories from database
     */
    async categorizeDevices(devices, categories) {
        const categoryList = categories.map(c => `- ${c.slug}: ${c.name}`).join('\n');

        const prompt = `You are a network infrastructure expert. Analyze the following devices and categorize each one.

Available categories:
${categoryList}

Devices to categorize (JSON array):
${JSON.stringify(devices.slice(0, 50), null, 2)}

Instructions:
1. For each device, determine the most appropriate category based on:
   - Model name (e.g., "DS-2CD" suggests Hikvision camera)
   - Manufacturer (e.g., "Cisco" suggests network equipment)
   - Description or hostname
2. Return ONLY a valid JSON array with objects containing:
   - original_index: the index of the device in the input array
   - suggested_category: the category slug
   - confidence: "high", "medium", or "low"
   - reason: brief explanation

Example output format:
[
  {"original_index": 0, "suggested_category": "cameras", "confidence": "high", "reason": "Hikvision DS-2CD is an IP camera model"},
  {"original_index": 1, "suggested_category": "switches", "confidence": "medium", "reason": "Cisco model suggests network switch"}
]

Return ONLY the JSON array, no additional text.`;

        const result = await this.chat(prompt, { temperature: 0.1 });

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
     * Analyze a spreadsheet and identify device sheets
     * @param {Object} workbookInfo - Information about sheets in the workbook
     */
    async analyzeSpreadsheet(workbookInfo) {
        const prompt = `You are analyzing an Excel spreadsheet for a network inventory system.

The workbook contains the following sheets:
${JSON.stringify(workbookInfo.sheets, null, 2)}

Each sheet contains columns like:
${JSON.stringify(workbookInfo.sampleColumns, null, 2)}

Instructions:
1. Identify which sheets contain device data
2. For each device sheet, determine the likely device type (cameras, nvrs, switches, routers, servers, access_points)
3. Identify the key columns for device import (IP, Serial, Model, Manufacturer, etc.)

Return a JSON object with:
{
  "sheets": [
    {
      "name": "Sheet name",
      "isDeviceSheet": true/false,
      "suggestedCategory": "category_slug or null",
      "columnMapping": {
        "ip_address": "column_name_in_sheet",
        "serial_number": "column_name_in_sheet",
        "model": "column_name_in_sheet",
        "manufacturer": "column_name_in_sheet",
        "hostname": "column_name_in_sheet"
      },
      "estimatedDeviceCount": number
    }
  ]
}

Return ONLY the JSON object, no additional text.`;

        const result = await this.chat(prompt, { temperature: 0.1 });

        if (!result.success) {
            return { success: false, error: result.error };
        }

        try {
            let jsonStr = result.response.trim();
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            const analysis = JSON.parse(jsonStr);
            return {
                success: true,
                analysis,
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
}

module.exports = new AIService();
