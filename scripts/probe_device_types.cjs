const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'onliops_local',
    user: process.env.PGUSER || 'onliops_admin',
    password: process.env.PGPASSWORD || 'OnliOps@2025!'
});

const typesToTest = [
    'camera', 'Camera', 'CAMERA',
    'ip_camera', 'ip-camera',
    'nvr', 'NVR',
    'switch', 'Switch',
    'other', 'Other',
    'converter', 'Converter'
];

async function probe() {
    const client = await pool.connect();

    // Need a valid project_id? The import endpoint uses one. 
    // I'll grab the first project.
    const projectRes = await client.query('SELECT id FROM projects LIMIT 1');
    if (projectRes.rows.length === 0) {
        console.error('No projects found to test with.');
        process.exit(1);
    }
    const projectId = projectRes.rows[0].id;

    // Need a valid vlan_id
    const vlanRes = await client.query('SELECT vlan_id FROM vlans WHERE project_id = $1 LIMIT 1', [projectId]);
    const vlanId = vlanRes.rows.length > 0 ? vlanRes.rows[0].vlan_id : null;

    if (!vlanId) {
        // Create dummy vlan if needed, but let's assume one exists or insert might fail on vlan FK
        console.warn('No VLAN found, insert might fail on FK.');
    }

    console.log('Starting probe...');

    for (const type of typesToTest) {
        const dummyIp = `192.168.254.${Math.floor(Math.random() * 250) + 1}`;
        try {
            await client.query('BEGIN');
            await client.query(`
                INSERT INTO network_devices (
                    project_id, vlan_id, device_type, model, manufacturer, ip_address, status
                ) VALUES ($1, $2, $3, 'PROBE_TEST', 'TEST', $4, 'active')
            `, [projectId, vlanId || 1, type, dummyIp]);

            console.log(`✅ SUCCESS: '${type}' is accepted.`);
            await client.query('ROLLBACK'); // Don't keep garbage
        } catch (error) {
            if (error.message.includes('network_devices_device_type_check')) {
                console.log(`❌ FAILED: '${type}' violated constraint.`);
            } else {
                console.log(`⚠️ ERROR on '${type}': ${error.message}`);
            }
            await client.query('ROLLBACK');
        }
    }

    client.release();
    process.exit(0);
}

probe();
