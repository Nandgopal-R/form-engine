import { Client } from 'pg';
import "dotenv/config";

const url = process.env.DATABASE_URL;
console.log("Using URL:", url ? url.substring(0, 20) + "..." : "UNDEFINED");
const client = new Client({
    connectionString: url,
});

async function check() {
    try {
        await client.connect();
        console.log("Connected via pg client.");
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log("Tables in public schema:");
        console.log(res.rows.map(r => r.table_name));
        await client.end();
    } catch (err) {
        console.error("PG Error:", err);
    }
}

check();
