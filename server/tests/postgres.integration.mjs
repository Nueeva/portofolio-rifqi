import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { buildApp } from '../app.mjs';
import { digest, token, hashPassword, verifyPassword } from '../security.mjs';

test('PostgreSQL password recovery revokes sessions and every outstanding reset link', async () => {
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const id = randomUUID(), email = `integration-${id}@example.invalid`;
  const resetA = token(), resetB = token(), oldSession = token(), password = token();
  const app = await buildApp({ db, config: {
    origin: 'https://portfolio.test', cookieSecret: token(), uploadDir: '/not-used',
  } });
  try {
    await db.query('INSERT INTO app_users(id,email,password_hash,verified,is_admin) VALUES($1,$2,$3,true,true)',
      [id, email, await hashPassword(token())]);
    for (const reset of [resetA, resetB]) {
      await db.query("INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,'reset',now()+interval '5 minutes')", [digest(reset), id]);
    }
    await db.query("INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '5 minutes')", [digest(oldSession), id]);
    const change = resetToken => app.inject({ method: 'POST', url: '/api/auth/password',
      headers: { origin: 'https://portfolio.test' }, payload: { password, resetToken } });
    assert.equal((await change(resetA)).statusCode, 200);
    const { rows } = await db.query('SELECT password_hash FROM app_users WHERE id=$1', [id]);
    assert.ok(await verifyPassword(password, rows[0].password_hash));
    assert.equal((await db.query('SELECT * FROM app_sessions WHERE user_id=$1', [id])).rows.length, 0);
    assert.equal((await change(resetA)).statusCode, 401);
    assert.equal((await change(resetB)).statusCode, 401);
    const session = await app.inject({ url: '/api/auth/session', headers: { cookie: `portfolio_session=${oldSession}` } });
    assert.equal(session.json().data.session, null);
  } finally {
    await db.query('DELETE FROM app_users WHERE id=$1', [id]);
    await app.close();
    await db.end();
  }
});
