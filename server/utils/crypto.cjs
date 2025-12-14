/**
 * Módulo de Criptografia AES-256-GCM
 * Para armazenamento seguro de senhas de dispositivos
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Obtém a chave de criptografia do ambiente
 * @returns {Buffer} Chave de 32 bytes
 */
function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        console.warn('[Crypto] ENCRYPTION_KEY not set, using default (INSECURE - only for development)');
        // Chave padrão para desenvolvimento - NÃO usar em produção!
        return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
    }
    return Buffer.from(key, 'hex');
}

/**
 * Criptografa texto usando AES-256-GCM
 * @param {string} plaintext - Texto a ser criptografado
 * @returns {string} JSON string com dados criptografados
 */
function encrypt(plaintext) {
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return JSON.stringify({
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        });
    } catch (error) {
        console.error('[Crypto] Encryption error:', error.message);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Descriptografa dados criptografados com AES-256-GCM
 * @param {string} encryptedData - JSON string com dados criptografados
 * @returns {string} Texto original
 */
function decrypt(encryptedData) {
    try {
        const key = getEncryptionKey();
        const { encrypted, iv, authTag } = JSON.parse(encryptedData);

        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            key,
            Buffer.from(iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('[Crypto] Decryption error:', error.message);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Verifica se uma string é uma senha criptografada válida
 * @param {string} data - String a verificar
 * @returns {boolean}
 */
function isEncrypted(data) {
    try {
        if (!data) return false;
        const parsed = JSON.parse(data);
        return parsed.encrypted && parsed.iv && parsed.authTag;
    } catch {
        return false;
    }
}

module.exports = {
    encrypt,
    decrypt,
    isEncrypted
};
