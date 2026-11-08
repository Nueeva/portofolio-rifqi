import pg from 'pg';import {readFile} from 'node:fs/promises';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});try{await pool.query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));console.log('Portfolio schema ready');}finally{await pool.end();}
