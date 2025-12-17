/**
 * AI Streaming Routes
 * SSE endpoint for real-time AI analysis visualization
 */

const express = require('express');
const router = express.Router();

// Import services
const aiService = require('../services/aiService.cjs');
const promptLoader = require('../prompts/index.cjs');

/**
 * POST /api/ai/stream/analyze
 * Stream AI analysis of spreadsheet with real-time tokens
 */
router.post('/analyze', async (req, res) => {
    const { workbookInfo, sessionId } = req.body;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // Helper to send SSE events
    const sendEvent = (type, data) => {
        res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    try {
        // Check AI availability
        const available = await aiService.isAvailable();
        if (!available) {
            sendEvent('error', { message: 'Ollama não está disponível' });
            res.end();
            return;
        }

        sendEvent('status', { message: '🔌 Conectado ao Ollama', stage: 'connected' });

        // Build the analysis prompt
        const prompt = promptLoader.getPrompt('analyze_spreadsheet', {
            sheets: workbookInfo?.sheets?.map(s => `- "${s.name}": ${s.rowCount} rows`).join('\n') || '',
            headers: JSON.stringify(workbookInfo?.sheets?.reduce((acc, s) => {
                acc[s.name] = s.headers;
                return acc;
            }, {}) || {}, null, 2),
            sample_data: JSON.stringify(workbookInfo?.sheets?.map(s => ({
                name: s.name,
                sample: s.sampleRows?.slice(0, 2)
            })) || [], null, 2)
        });

        if (!prompt) {
            sendEvent('error', { message: 'Prompt de análise não encontrado' });
            res.end();
            return;
        }

        sendEvent('status', { message: '🧠 Iniciando análise...', stage: 'analyzing' });

        // Stream the AI response
        let tokenCount = 0;
        const result = await aiService.chatStream(
            prompt.content,
            {
                temperature: prompt.temperature || 0.1,
                maxTokens: prompt.maxTokens || 2048
            },
            (token, info) => {
                tokenCount++;
                sendEvent('token', { content: token, count: tokenCount });

                if (info.done) {
                    sendEvent('status', { message: '✅ Análise concluída', stage: 'complete' });
                }
            }
        );

        // Parse the result
        try {
            let jsonStr = result.response.trim();
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }
            const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                jsonStr = objectMatch[0];
            }

            const analysis = JSON.parse(jsonStr);
            sendEvent('result', {
                success: true,
                analysis,
                model: result.model,
                tokenCount
            });
        } catch (parseError) {
            sendEvent('result', {
                success: false,
                error: 'Falha ao interpretar resposta da IA',
                rawResponse: result.response?.substring(0, 500)
            });
        }

    } catch (error) {
        console.error('Stream analysis error:', error);
        sendEvent('error', { message: error.message || 'Erro na análise' });
    } finally {
        sendEvent('end', {});
        res.end();
    }
});

/**
 * POST /api/ai/stream/categorize
 * Stream device categorization
 */
router.post('/categorize', async (req, res) => {
    const { devices, categories } = req.body;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (type, data) => {
        res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    try {
        const available = await aiService.isAvailable();
        if (!available) {
            sendEvent('error', { message: 'Ollama não está disponível' });
            res.end();
            return;
        }

        sendEvent('status', { message: '📦 Categorizando dispositivos...', stage: 'categorizing' });

        const categoryList = categories?.map(c => `- ${c.slug}: ${c.name}`).join('\n') || '';
        const prompt = promptLoader.getPrompt('categorize_devices', {
            categories: categoryList,
            devices: devices?.slice(0, 30) || []
        });

        if (!prompt) {
            sendEvent('error', { message: 'Prompt de categorização não encontrado' });
            res.end();
            return;
        }

        let tokenCount = 0;
        const result = await aiService.chatStream(
            prompt.content,
            { temperature: 0.1 },
            (token, info) => {
                tokenCount++;
                sendEvent('token', { content: token, count: tokenCount });
            }
        );

        // Parse result
        try {
            let jsonStr = result.response.trim();
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }
            const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            }

            const categorizations = JSON.parse(jsonStr);
            sendEvent('result', {
                success: true,
                categorizations,
                model: result.model,
                tokenCount
            });
        } catch (parseError) {
            sendEvent('result', {
                success: false,
                error: 'Falha ao interpretar categorização'
            });
        }

    } catch (error) {
        sendEvent('error', { message: error.message });
    } finally {
        sendEvent('end', {});
        res.end();
    }
});

/**
 * POST /api/ai/stream/identify
 * Stream Hikvision device identification
 */
router.post('/identify', async (req, res) => {
    const { devices } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (type, data) => {
        res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    try {
        const available = await aiService.isAvailable();
        if (!available) {
            sendEvent('error', { message: 'Ollama não está disponível' });
            res.end();
            return;
        }

        sendEvent('status', { message: '🎥 Identificando dispositivos Hikvision...', stage: 'identifying' });

        const prompt = promptLoader.getPrompt('identify_hikvision', {
            devices: devices?.slice(0, 20) || []
        });

        if (!prompt) {
            sendEvent('error', { message: 'Prompt de identificação não encontrado' });
            res.end();
            return;
        }

        let tokenCount = 0;
        const result = await aiService.chatStream(
            prompt.content,
            { temperature: 0.1 },
            (token, info) => {
                tokenCount++;
                sendEvent('token', { content: token, count: tokenCount });
            }
        );

        sendEvent('result', {
            success: true,
            response: result.response,
            model: result.model,
            tokenCount
        });

    } catch (error) {
        sendEvent('error', { message: error.message });
    } finally {
        sendEvent('end', {});
        res.end();
    }
});

module.exports = router;
