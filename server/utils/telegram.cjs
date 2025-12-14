/**
 * Módulo de Integração com Telegram Bot API
 * Para envio seguro de senhas de dispositivos
 */

const https = require('https');

/**
 * Obtém o token do bot do ambiente
 * @returns {string|null}
 */
function getBotToken() {
    return process.env.TELEGRAM_BOT_TOKEN || null;
}

/**
 * Envia mensagem via Telegram Bot API
 * @param {string} chatId - ID do chat do destinatário
 * @param {string} message - Mensagem a enviar
 * @param {object} options - Opções adicionais
 * @returns {Promise<boolean>}
 */
async function sendMessage(chatId, message, options = {}) {
    const token = getBotToken();

    if (!token) {
        console.error('[Telegram] Bot token not configured');
        return false;
    }

    const payload = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: true
    });

    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.ok) {
                        console.log('[Telegram] Message sent successfully');
                        resolve(true);
                    } else {
                        console.error('[Telegram] API error:', result.description);
                        resolve(false);
                    }
                } catch (e) {
                    console.error('[Telegram] Parse error:', e.message);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('[Telegram] Request error:', error.message);
            resolve(false);
        });

        req.write(payload);
        req.end();
    });
}

/**
 * Gera código de verificação de 6 dígitos
 * @returns {string}
 */
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Formata mensagem de senha para envio
 * @param {string} deviceName - Nome/modelo do dispositivo
 * @param {string} deviceIp - IP do dispositivo
 * @param {string} username - Usuário admin
 * @param {string} password - Senha
 * @param {string} requesterName - Nome de quem solicitou
 * @returns {string}
 */
function formatPasswordMessage(deviceName, deviceIp, username, password, requesterName) {
    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    return `🔐 <b>Credenciais Solicitadas</b>

<b>Dispositivo:</b> ${deviceName}
<b>IP:</b> ${deviceIp}

<b>Usuário:</b> <code>${username}</code>
<b>Senha:</b> <code>${password}</code>

📋 <i>Solicitado por: ${requesterName}</i>
🕐 <i>${now}</i>

⚠️ Esta mensagem será excluída automaticamente em 5 minutos.`;
}

/**
 * Formata mensagem de código de verificação
 * @param {string} code - Código de verificação
 * @returns {string}
 */
function formatVerificationMessage(code) {
    return `🔑 <b>Código de Verificação OnliOps</b>

Seu código: <code>${code}</code>

Digite este código na plataforma para vincular sua conta.

⚠️ O código expira em 10 minutos.`;
}

/**
 * Envia mensagem de boas-vindas
 * @param {string} chatId 
 * @returns {Promise<boolean>}
 */
async function sendWelcomeMessage(chatId) {
    const message = `👋 <b>Bem-vindo ao OnliOps Bot!</b>

Este bot é usado para enviar credenciais de dispositivos de forma segura.

Para vincular sua conta:
1. Acesse seu perfil na plataforma OnliOps
2. Clique em "Vincular Telegram"
3. Digite o código de verificação

Seus comandos:
/start - Ver esta mensagem
/status - Verificar status da vinculação`;

    return sendMessage(chatId, message);
}

/**
 * Agenda exclusão de mensagem após delay
 * @param {string} chatId 
 * @param {number} messageId 
 * @param {number} delayMs 
 */
async function scheduleMessageDeletion(chatId, messageId, delayMs = 300000) {
    const token = getBotToken();
    if (!token) return;

    setTimeout(async () => {
        const payload = JSON.stringify({
            chat_id: chatId,
            message_id: messageId
        });

        const req = https.request({
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/deleteMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        });

        req.on('error', () => { });
        req.write(payload);
        req.end();
    }, delayMs);
}

// Armazenamento temporário de códigos de verificação
const verificationCodes = new Map();

/**
 * Armazena código de verificação temporariamente
 * @param {string} userId - ID do usuário
 * @param {string} code - Código gerado
 */
function storeVerificationCode(userId, code) {
    verificationCodes.set(userId, {
        code,
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000 // 10 minutos
    });

    // Limpar após expiração
    setTimeout(() => {
        verificationCodes.delete(userId);
    }, 600000);
}

/**
 * Verifica código de verificação
 * @param {string} userId - ID do usuário
 * @param {string} code - Código informado
 * @returns {boolean}
 */
function verifyCode(userId, code) {
    const stored = verificationCodes.get(userId);
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(userId);
        return false;
    }
    if (stored.code === code) {
        verificationCodes.delete(userId);
        return true;
    }
    return false;
}

module.exports = {
    sendMessage,
    generateVerificationCode,
    formatPasswordMessage,
    formatVerificationMessage,
    sendWelcomeMessage,
    scheduleMessageDeletion,
    storeVerificationCode,
    verifyCode,
    getBotToken
};
