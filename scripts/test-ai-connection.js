#!/usr/bin/env node
/**
 * Test script to verify AI (Ollama) connectivity
 * Run: node scripts/test-ai-connection.js
 */

const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

async function testConnection() {
    console.log('🔍 Testing Ollama connection...\n');
    console.log(`Ollama URL: ${OLLAMA_URL}\n`);

    try {
        // Test 1: Check if Ollama is reachable
        console.log('1️⃣  Checking Ollama availability...');
        const tagsResponse = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
        console.log('   ✅ Ollama is running!\n');

        // Test 2: List available models
        console.log('2️⃣  Available models:');
        const models = tagsResponse.data.models || [];
        if (models.length === 0) {
            console.log('   ⚠️  No models installed. Run: ollama pull llama3 or ollama pull phi3\n');
        } else {
            models.forEach(m => {
                const sizeGB = (m.size / (1024 * 1024 * 1024)).toFixed(2);
                console.log(`   - ${m.name} (${sizeGB} GB)`);
            });
            console.log('');
        }

        // Test 3: Test a simple generation (if models available)
        if (models.length > 0) {
            const testModel = models[0].name;
            console.log(`3️⃣  Testing generation with ${testModel}...`);

            const genResponse = await axios.post(`${OLLAMA_URL}/api/generate`, {
                model: testModel,
                prompt: 'Say "Hello from OnliOps AI!" in exactly those words.',
                stream: false,
                options: {
                    num_predict: 50,
                    temperature: 0.1
                }
            }, { timeout: 60000 });

            console.log(`   ✅ Generation successful!`);
            console.log(`   Response: ${genResponse.data.response.trim()}`);
            console.log(`   Time: ${(genResponse.data.total_duration / 1e9).toFixed(2)}s\n`);
        }

        console.log('🎉 All tests passed! AI integration is ready.\n');

        console.log('📝 To use the AI features in OnliOps:');
        console.log('   1. Restart the import-api server: node server/import-api.cjs');
        console.log('   2. Use the Smart Import feature in the frontend');
        console.log('   3. Try the AI chat endpoints:\n');
        console.log('   curl -X POST http://localhost:3001/api/ai/status');
        console.log('   curl -X POST http://localhost:3001/api/ai/chat -H "Content-Type: application/json" -d \'{"message":"Hello"}\'\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Ollama is not running. To install and start:');
            console.log('   1. Install: curl -fsSL https://ollama.com/install.sh | sh');
            console.log('   2. Start: ollama serve');
            console.log('   3. Pull a model: ollama pull llama3  (or phi3 for smaller size)\n');
        }

        process.exit(1);
    }
}

testConnection();
