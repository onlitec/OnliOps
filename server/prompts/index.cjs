/**
 * Prompt Loader Module
 * Carrega e processa prompts de arquivos Markdown com suporte a variáveis dinâmicas
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = __dirname;

/**
 * Carrega um prompt de arquivo Markdown
 * @param {string} name - Nome do prompt (sem extensão)
 * @returns {Object} Prompt com metadata e conteúdo
 */
function loadPrompt(name) {
    const filePath = path.join(PROMPTS_DIR, `${name}.md`);

    if (!fs.existsSync(filePath)) {
        console.error(`Prompt file not found: ${filePath}`);
        return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Parse YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!frontmatterMatch) {
        return {
            name,
            content: content,
            metadata: {}
        };
    }

    const yamlContent = frontmatterMatch[1];
    const promptContent = frontmatterMatch[2].trim();

    // Simple YAML parsing
    const metadata = {};
    yamlContent.split('\n').forEach(line => {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
            const key = match[1];
            let value = match[2].trim();

            // Parse numbers
            if (!isNaN(value) && value !== '') {
                value = parseFloat(value);
            }
            // Parse booleans
            else if (value === 'true') value = true;
            else if (value === 'false') value = false;

            metadata[key] = value;
        }
    });

    return {
        name,
        content: promptContent,
        metadata
    };
}

/**
 * Processa um prompt substituindo variáveis dinâmicas
 * @param {string} promptContent - Conteúdo do prompt
 * @param {Object} variables - Variáveis para substituição
 * @returns {string} Prompt processado
 */
function processPrompt(promptContent, variables = {}) {
    let processed = promptContent;

    Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key.toUpperCase()}}}`;

        // Convert objects/arrays to JSON string
        const replacement = typeof value === 'object'
            ? JSON.stringify(value, null, 2)
            : String(value);

        processed = processed.replace(new RegExp(placeholder, 'g'), replacement);
    });

    return processed;
}

/**
 * Carrega e processa um prompt com variáveis
 * @param {string} name - Nome do prompt
 * @param {Object} variables - Variáveis para substituição
 * @returns {Object} Prompt pronto para uso
 */
function getPrompt(name, variables = {}) {
    const prompt = loadPrompt(name);

    if (!prompt) {
        return null;
    }

    return {
        ...prompt,
        content: processPrompt(prompt.content, variables),
        temperature: prompt.metadata.temperature || 0.1,
        maxTokens: prompt.metadata.max_tokens || 2048
    };
}

/**
 * Lista todos os prompts disponíveis
 * @returns {Array} Lista de nomes de prompts
 */
function listPrompts() {
    const files = fs.readdirSync(PROMPTS_DIR);
    return files
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''));
}

// Prompts pré-carregados para acesso rápido
const PROMPTS = {
    IDENTIFY_HIKVISION: 'identify_hikvision',
    CATEGORIZE_DEVICES: 'categorize_devices',
    ANALYZE_SPREADSHEET: 'analyze_spreadsheet'
};

module.exports = {
    loadPrompt,
    processPrompt,
    getPrompt,
    listPrompts,
    PROMPTS,
    PROMPTS_DIR
};
