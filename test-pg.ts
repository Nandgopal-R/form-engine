import { Client } from 'pg';

const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_J4i8KPjvVtem@ep-shy-feather-a1cdrpo9.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
});

async function test() {
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected!');
        const res = await client.query('SELECT NOW()');
        console.log('Query result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err.message);
        process.exit(1);
    }
}

test();
