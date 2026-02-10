const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'onliops_local',
    user: process.env.PGUSER_SUPER || 'postgres',
    password: process.env.PGPASSWORD_SUPER || 'postgres'
});

async function removeConstraint() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('Dropping restrictive check constraint...');
        await client.query('ALTER TABLE network_devices DROP CONSTRAINT IF EXISTS network_devices_device_type_check');

        console.log('Constraint dropped successfully!');
        client.release();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

removeConstraint();
