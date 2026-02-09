/**
 * HikCentral Professional OpenAPI Service
 * Handles authentication (Artemis Signature) and data fetching from HikCentral.
 */

const axios = require('axios');
const crypto = require('crypto');

class HikCentralService {
    /**
     * Calculate Artemis Signature for HikCentral OpenAPI
     * @param {string} method - HTTP Method (POST)
     * @param {string} path - API Path
     * @param {Object} headers - Request headers
     * @param {string} appSecret - App Secret (SK)
     */
    calculateSignature(method, path, headers, appSecret) {
        const accept = headers['Accept'] || '*/*';
        const contentType = headers['Content-Type'] || '';

        // Build signing string
        let stringToSign = `${method.toUpperCase()}\n${accept}\n${contentType}\n`;

        // Add headers (only those starting with X-Ca- are usually required for signing)
        // For simplicity and based on Artemis docs, we focus on X-Ca- items if needed, 
        // but often the basic string is enough for standard calls.
        const caHeaders = Object.keys(headers)
            .filter(k => k.toLowerCase().startsWith('x-ca-'))
            .sort()
            .map(k => `${k.toLowerCase()}:${headers[k]}`)
            .join('\n');

        if (caHeaders) {
            stringToSign += caHeaders + '\n';
        }

        stringToSign += path;

        return crypto
            .createHmac('sha256', appSecret)
            .update(stringToSign)
            .digest('base64');
    }

    /**
     * Generic request wrapper for HikCentral
     */
    async request(config, path, data = {}) {
        const { host, appKey, appSecret } = config;
        const url = `${host.replace(/\/$/, '')}${path}`;
        const timestamp = Date.now();

        const headers = {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'X-Ca-Key': appKey,
            'X-Ca-Timestamp': timestamp.toString(),
            'X-Ca-Signature-Headers': 'x-ca-key,x-ca-timestamp'
        };

        const signature = this.calculateSignature('POST', path, headers, appSecret);
        headers['X-Ca-Signature'] = signature;

        try {
            const response = await axios.post(url, data, {
                headers,
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) // Support self-signed certs
            });

            if (response.data?.code !== '0') {
                throw new Error(response.data?.msg || 'Erro na API HikCentral');
            }

            return response.data.data;
        } catch (error) {
            console.error(`HikCentral Request Error (${path}):`, error.message);
            throw error;
        }
    }

    /**
     * Get Encoding Devices (Cameras, NVRs)
     */
    async getEncodingDevices(config) {
        return this.request(config, '/artemis/api/resource/v1/encodeDevice/getEncodeDevicePage', {
            pageNo: 1,
            pageSize: 1000
        });
    }

    /**
     * Get Access Control Devices
     */
    async getAcsDevices(config) {
        return this.request(config, '/artemis/api/resource/v1/acsDevice/getAcsDevicePage', {
            pageNo: 1,
            pageSize: 1000
        });
    }

    /**
     * Get Network Devices (Switches)
     */
    async getNetDevices(config) {
        return this.request(config, '/artemis/api/resource/v1/netDevice/getNetDevicePage', {
            pageNo: 1,
            pageSize: 1000
        });
    }

    /**
     * Map HikCentral Device to OnliOps Schema
     */
    mapDevice(hcDevice, category) {
        // Basic mapping logic
        return {
            device_type: category,
            model: hcDevice.model || 'Unknown',
            manufacturer: 'Hikvision',
            ip_address: hcDevice.ip || hcDevice.ipAddress || '0.0.0.0',
            serial_number: hcDevice.indexCode || hcDevice.serialNumber,
            hostname: hcDevice.name,
            status: hcDevice.status === 1 || hcDevice.status === '1' ? 'active' : 'inactive',
            custom_fields: {
                hikcentral_id: hcDevice.indexCode,
                original_data: hcDevice
            }
        };
    }

    /**
     * Perform the full sync process for a project
     * @param {Object} pool - Postgres connection pool
     * @param {string} projectId - Project ID
     * @param {Object} config - HikCentral configuration
     */
    async performSync(pool, projectId, config) {
        try {
            // 1. Fetch all types
            const [encoders, acs, net] = await Promise.all([
                this.getEncodingDevices(config),
                this.getAcsDevices(config),
                this.getNetDevices(config)
            ]);

            const allDevices = [
                ...(encoders.list || []).map(d => ({ ...d, type: 'camera' })),
                ...(acs.list || []).map(d => ({ ...d, type: 'access_control' })),
                ...(net.list || []).map(d => ({ ...d, type: 'switch' }))
            ];

            let imported = 0;
            for (const hcDev of allDevices) {
                const mapped = this.mapDevice(hcDev, hcDev.type);

                // Upsert device in database
                await pool.query(`
                    INSERT INTO network_devices (
                        project_id, device_type, model, manufacturer, 
                        ip_address, serial_number, hostname, status, custom_fields, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                    ON CONFLICT (project_id, COALESCE(serial_number, '')) WHERE serial_number IS NOT NULL
                    DO UPDATE SET 
                        model = EXCLUDED.model,
                        status = EXCLUDED.status,
                        ip_address = EXCLUDED.ip_address,
                        hostname = EXCLUDED.hostname,
                        custom_fields = EXCLUDED.custom_fields,
                        updated_at = NOW()
                `, [
                    projectId, mapped.device_type, mapped.model, mapped.manufacturer,
                    mapped.ip_address, mapped.serial_number, mapped.hostname,
                    mapped.status, JSON.stringify(mapped.custom_fields)
                ]);
                imported++;
            }

            return { success: true, imported };

        } catch (error) {
            console.error(`[HikCentral] Sync failed for project ${projectId}:`, error.message);
            throw error;
        }
    }

    /**
     * Test connection and credentials
     */
    async testConnection(config) {
        try {
            // Try to fetch a small page of devices as a test
            await this.request(config, '/artemis/api/resource/v1/encodeDevice/getEncodeDevicePage', {
                pageNo: 1,
                pageSize: 1
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new HikCentralService();
