const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'onliops',
    user: process.env.PGUSER || 'onliops',
    password: process.env.PGPASSWORD
});

async function check() {
    try {
        console.log('Checking tables...');
        const { rows: tables } = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tables.map(t => t.table_name).join(', '));

        if (tables.some(t => t.table_name === 'branding_info')) {
            console.log('branding_info exists');
        } else {
            console.log('branding_info DOES NOT exist');
        }

        if (tables.some(t => t.table_name === 'system_settings')) {
            console.log('system_settings exists');
            const { rows: settings } = await pool.query("SELECT key, value FROM system_settings");
            console.log('Settings keys:', settings.map(s => s.key).join(', '));
        } else {
            console.log('system_settings DOES NOT exist');
        }

        if (tables.some(t => t.table_name === 'project_integrations')) {
            console.log('project_integrations exists');
            const { rows: count } = await pool.query("SELECT COUNT(*) FROM project_integrations");
            console.log('Integrations count:', count[0].count);
        } else {
            console.log('project_integrations DOES NOT exist');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

check();
