/**
 * Project Integrations Routes
 * Handles configuration and synchronization for external providers like HikCentral.
 */

const express = require('express');
const router = express.Router();
const hikcentral = require('../services/hikcentralService.cjs');

module.exports = function (pool) {
    // Get all integrations
    router.get('/all', async (req, res) => {
        try {
            const { rows } = await pool.query(`
                SELECT pi.*, p.name as project_name 
                FROM project_integrations pi
                JOIN projects p ON pi.project_id = p.id
            `);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get integration config for a project
    router.get('/:projectId/:provider', async (req, res) => {
        const { projectId, provider } = req.params;
        try {
            const { rows } = await pool.query(
                'SELECT * FROM project_integrations WHERE project_id = $1 AND provider = $2',
                [projectId, provider]
            );
            res.json(rows[0] || null);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Save/Update integration config
    router.post('/:projectId/:provider', async (req, res) => {
        const { projectId, provider } = req.params;
        const config = req.body;

        try {
            const { rows } = await pool.query(`
                INSERT INTO project_integrations (project_id, provider, config, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (project_id, provider)
                DO UPDATE SET config = $3, updated_at = NOW()
                RETURNING *
            `, [projectId, provider, config]);

            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Test connection
    router.post('/:projectId/:provider/test', async (req, res) => {
        const config = req.body;
        const { provider } = req.params;

        if (provider === 'hikcentral') {
            const result = await hikcentral.testConnection(config);
            return res.json(result);
        }

        res.status(400).json({ error: 'Provider not supported for testing' });
    });

    // Sync devices
    router.post('/:projectId/:provider/sync', async (req, res) => {
        const { projectId, provider } = req.params;

        try {
            // 1. Get config
            const { rows } = await pool.query(
                'SELECT config FROM project_integrations WHERE project_id = $1 AND provider = $2',
                [projectId, provider]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Configuração não encontrada' });
            }

            const config = rows[0].config;

            // 2. Update status to syncing
            await pool.query(
                'UPDATE project_integrations SET sync_status = $1 WHERE project_id = $2 AND provider = $3',
                ['syncing', projectId, provider]
            );

            // 3. Perform sync based on provider
            if (provider === 'hikcentral') {
                try {
                    const result = await hikcentral.performSync(pool, projectId, config);

                    // 4. Final update
                    await pool.query(`
                        UPDATE project_integrations 
                        SET sync_status = 'idle', last_sync = NOW() 
                        WHERE project_id = $1 AND provider = $2
                    `, [projectId, provider]);

                    return res.json(result);

                } catch (syncError) {
                    await pool.query(
                        'UPDATE project_integrations SET sync_status = $1 WHERE project_id = $2 AND provider = $3',
                        ['failed', projectId, provider]
                    );
                    throw syncError;
                }
            }

            res.status(400).json({ error: 'Provider not supported for sync' });

        } catch (error) {
            console.error('Sync Error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
