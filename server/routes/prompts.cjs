/**
 * Prompts API Routes
 * API for managing AI prompts (list, read, update)
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(__dirname, '../prompts');

/**
 * GET /api/prompts
 * List all available prompts
 */
router.get('/', (req, res) => {
    try {
        if (!fs.existsSync(PROMPTS_DIR)) {
            return res.json({ prompts: [] });
        }

        const files = fs.readdirSync(PROMPTS_DIR);
        const prompts = files
            .filter(f => f.endsWith('.md'))
            .map(f => {
                const filePath = path.join(PROMPTS_DIR, f);
                const content = fs.readFileSync(filePath, 'utf8');
                const stats = fs.statSync(filePath);

                // Parse frontmatter for metadata
                const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
                let metadata = {};
                if (frontmatterMatch) {
                    frontmatterMatch[1].split('\n').forEach(line => {
                        const match = line.match(/^(\w+):\s*(.*)$/);
                        if (match) {
                            metadata[match[1]] = match[2].trim();
                        }
                    });
                }

                return {
                    name: f.replace('.md', ''),
                    filename: f,
                    size: stats.size,
                    modified: stats.mtime,
                    metadata
                };
            });

        res.json({ prompts });
    } catch (error) {
        console.error('Error listing prompts:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/prompts/:name
 * Get a specific prompt content
 */
router.get('/:name', (req, res) => {
    try {
        const { name } = req.params;
        const filePath = path.join(PROMPTS_DIR, `${name}.md`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Prompt not found' });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);

        res.json({
            name,
            content,
            size: stats.size,
            modified: stats.mtime
        });
    } catch (error) {
        console.error('Error reading prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/prompts/:name
 * Update a prompt content
 */
router.put('/:name', (req, res) => {
    try {
        const { name } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const filePath = path.join(PROMPTS_DIR, `${name}.md`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Prompt not found' });
        }

        // Backup original
        const backupPath = path.join(PROMPTS_DIR, `${name}.md.bak`);
        fs.copyFileSync(filePath, backupPath);

        // Write new content
        fs.writeFileSync(filePath, content, 'utf8');

        const stats = fs.statSync(filePath);

        res.json({
            success: true,
            name,
            size: stats.size,
            modified: stats.mtime,
            message: 'Prompt saved successfully'
        });
    } catch (error) {
        console.error('Error saving prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/prompts/:name/restore
 * Restore a prompt from backup
 */
router.post('/:name/restore', (req, res) => {
    try {
        const { name } = req.params;
        const backupPath = path.join(PROMPTS_DIR, `${name}.md.bak`);
        const filePath = path.join(PROMPTS_DIR, `${name}.md`);

        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({ error: 'No backup found' });
        }

        fs.copyFileSync(backupPath, filePath);
        const content = fs.readFileSync(filePath, 'utf8');

        res.json({
            success: true,
            name,
            content,
            message: 'Prompt restored from backup'
        });
    } catch (error) {
        console.error('Error restoring prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
