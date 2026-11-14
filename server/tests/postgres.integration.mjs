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

test('analytics counts every visit beyond 1000 and filters periods and pages',async()=>{
 const {analyticsSummary}=await import('../analytics.mjs');
 const db=new pg.Pool({connectionString:process.env.DATABASE_URL});
 const prefix=randomUUID();const path='/integration-'+prefix;
 try{
  await db.query(`INSERT INTO content_records(resource,id,data)
   SELECT 'page_analytics',$1 || '-' || n,jsonb_build_object('id',$1 || '-' || n,'page_path',$2::text,
   'visitor_id','visitor-' || (n%7),'created_at',now()-interval '1 day','referrer','https://example.com/source') FROM generate_series(1,1205) n`,[prefix,path]);
  await db.query(`INSERT INTO content_records(resource,id,data) VALUES('page_analytics',$1,jsonb_build_object('page_path',$2::text,'visitor_id','old','created_at',now()-interval '60 days','referrer',''))`,[prefix+'-old',path]);
  const recent=await analyticsSummary(db,{timeRange:'7d',page:path});
  assert.equal(recent.totalViews,1205);assert.equal(recent.uniqueVisitors,7);assert.equal(recent.topReferrers[0].referrer,'example.com');assert.equal(recent.topReferrers[0].count,1205);assert.equal(recent.viewsByDate.length,1);
  assert.equal((await analyticsSummary(db,{timeRange:'all',page:path})).totalViews,1206);
  const empty=await analyticsSummary(db,{timeRange:'all',page:path+'-missing'});assert.equal(empty.totalViews,0);assert.equal(empty.avgViewsPerDay,0);assert.deepEqual(empty.viewsByDate,[]);
  await assert.rejects(analyticsSummary(db,{timeRange:'invalid',page:path}),/Filter analytics/);
 }finally{await db.query("DELETE FROM content_records WHERE resource='page_analytics' AND id LIKE $1",[prefix+'%']);await db.end();}
});

test('content updates validate the final record, reject nulls and preserve valid edits',async()=>{
 const db=new pg.Pool({connectionString:process.env.DATABASE_URL});
 const id=randomUUID(),projectId='integration-'+randomUUID(),session=token();
 const origin='https://portfolio.test';const cookie=`portfolio_session=${session}`;
 const app=await buildApp({db,config:{origin,cookieSecret:token(),uploadDir:'/not-used'}});
 const project={id:projectId,title:'Before edit',problem:'Problem',solution:'Solution',category:'tools',tech_stack:[]};
 try{
  await db.query('INSERT INTO app_users(id,email,password_hash,verified,is_admin) VALUES($1,$2,$3,true,true)',[id,`${id}@example.invalid`,await hashPassword(token())]);
  await db.query("INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '5 minutes')",[digest(session),id]);
  await db.query("INSERT INTO content_records(resource,id,data) VALUES('projects',$1,$2::jsonb)",[projectId,JSON.stringify(project)]);
  const update=values=>app.inject({method:'POST',url:'/api/data/projects',headers:{origin,cookie},payload:{operation:'update',filters:[{field:'id',operator:'eq',value:projectId}],values}});
  assert.equal((await update({title:null})).statusCode,400);
  assert.equal((await update({title:'After edit'})).statusCode,200);
  const read=await db.query("SELECT data FROM content_records WHERE resource='projects' AND id=$1",[projectId]);
  assert.equal(read.rows[0].data.title,'After edit');assert.equal(read.rows[0].data.problem,'Problem');
  const summary=await app.inject({method:'POST',url:'/api/analytics/summary',headers:{origin,cookie},payload:{timeRange:'all',page:'/no-visits-'+id}});
  assert.equal(summary.statusCode,200);assert.equal(summary.json().data.totalViews,0);
  const snapshot=await app.inject('/api/public-content');assert.equal(snapshot.statusCode,200);
  assert.equal(snapshot.json().data.projects.find(row=>row.id===projectId).title,'After edit');

  // A pre-existing malformed row must not become a valid write via a partial patch.
  await db.query("UPDATE content_records SET data=data-'problem' WHERE resource='projects' AND id=$1",[projectId]);
  assert.equal((await update({title:'Should roll back'})).statusCode,400);
  assert.equal((await db.query("SELECT data->>'title' AS title FROM content_records WHERE resource='projects' AND id=$1",[projectId])).rows[0].title,'After edit');
  const editorial=await app.inject({method:'POST',url:'/api/data/portfolio_project_content',headers:{origin,cookie},payload:{operation:'insert',values:{project_key:projectId,overview:'Context',featured:true,sort_order:0}}});
  assert.equal(editorial.statusCode,400);
 }finally{
  await db.query('DELETE FROM content_records WHERE id=$1',[projectId]);
  await db.query('DELETE FROM app_users WHERE id=$1',[id]);await app.close();await db.end();
 }
});
