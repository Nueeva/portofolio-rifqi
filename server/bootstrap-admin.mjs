import pg from 'pg';import {hashPassword,validEmail} from './security.mjs';
const email=process.env.ADMIN_EMAIL,password=process.env.ADMIN_PASSWORD;
if(!validEmail(email)||!password||password.length<16)throw Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (16+ characters) in the process environment');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});try{
const {rows}=await pool.query('SELECT id FROM app_users WHERE is_admin=true LIMIT 1');if(rows.length)throw Error('An admin already exists; bootstrap refused');
await pool.query('INSERT INTO app_users(email,password_hash,is_admin,verified) VALUES($1,$2,true,true)',[email.toLowerCase(),await hashPassword(password)]);console.log('Admin created; no password printed.');
}finally{await pool.end();}
