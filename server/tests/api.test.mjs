import {test} from 'node:test';import assert from 'node:assert/strict';import {buildApp} from '../app.mjs';
const calls=[];const db={query:async(sql,values)=>{calls.push({sql,values});return {rows:[]};}};
async function setup(){return buildApp({db,config:{origin:'https://portfolio.test',cookieSecret:'a'.repeat(64),uploadDir:'/not-used'}});}
test('cross-origin mutations are rejected before queries execute',async()=>{const app=await setup();try{const response=await app.inject({method:'POST',url:'/api/data/projects',headers:{origin:'https://evil.test'},payload:{operation:'delete',filters:[]}});assert.equal(response.statusCode,403);}finally{await app.close();}});
test('anonymous content reads work but private resources and writes require admin',async()=>{const app=await setup();try{for(const resource of ['page_analytics','activity_logs','ip_logs']){const res=await app.inject({method:'POST',url:'/api/data/'+resource,headers:{origin:'https://portfolio.test'},payload:{operation:'select'}});assert.equal(res.statusCode,403);}const read=await app.inject({method:'POST',url:'/api/data/projects',headers:{origin:'https://portfolio.test'},payload:{operation:'select'}});assert.equal(read.statusCode,200);const write=await app.inject({method:'POST',url:'/api/data/projects',headers:{origin:'https://portfolio.test'},payload:{operation:'insert',values:{}}});assert.equal(write.statusCode,403);}finally{await app.close();}});
test('SQL identifiers and resource names are not interpolated from arbitrary input',async()=>{const app=await setup();try{const response=await app.inject({method:'POST',url:'/api/data/projects',headers:{origin:'https://portfolio.test'},payload:{operation:'select',filters:[{field:'id);DROP TABLE app_users;--',operator:'eq',value:'a'}]}});assert.equal(response.statusCode,400);const privateTable=await app.inject({method:'POST',url:'/api/data/app_users',headers:{origin:'https://portfolio.test'},payload:{operation:'select'}});assert.equal(privateTable.statusCode,404);}finally{await app.close();}});
test('unconfigured mail is unavailable and optional captcha is reported honestly',async()=>{const app=await setup();try{const config=await app.inject('/api/config');assert.equal(config.json().captchaEnabled,false);const response=await app.inject({method:'POST',url:'/api/functions/send-contact-email',headers:{origin:'https://portfolio.test'},payload:{name:'A',email:'a@test.com',message:'test'}});assert.equal(response.statusCode,503);}finally{await app.close();}});

test('an unverified account can recover by resending its verification email',async()=>{
 const messages=[];const database={query:async sql=>({rows:sql.includes('FROM app_users WHERE email')?[{id:'00000000-0000-0000-0000-000000000001',email:'owner@test.com',verified:false}]:[]})};
 const app=await buildApp({db:database,config:{origin:'https://portfolio.test',cookieSecret:'x'.repeat(64),uploadDir:'/not-used',mailFrom:'site@test.com'},mailer:async message=>messages.push(message)});
 try{const response=await app.inject({method:'POST',url:'/api/auth/signup',headers:{origin:'https://portfolio.test'},payload:{email:'owner@test.com',password:'a long password 2026'}});assert.equal(response.statusCode,200);assert.equal(messages.length,1);assert.match(messages[0].text,/api\/auth\/confirm/);}finally{await app.close();}
});
test('unblocking emits the deleted IP to realtime subscribers',async()=>{
 const deleted={id:'198.51.100.5',ip_address:'198.51.100.5'};
 const database={query:async sql=>({rows:sql.includes('JOIN app_users')?[{id:'00000000-0000-0000-0000-000000000001',email:'admin@test.com',is_admin:true}]:sql.includes('DELETE FROM content_records')?[{data:deleted}]:[]})};
 const app=await buildApp({db:database,config:{origin:'https://portfolio.test',cookieSecret:'x'.repeat(64),uploadDir:'/not-used'}});
 await app.listen({host:'127.0.0.1',port:0});const base=`http://127.0.0.1:${app.server.address().port}`;const cookie='portfolio_session='+ 'a'.repeat(64);let reader;
 try{const stream=await fetch(base+'/api/events',{headers:{Cookie:cookie},signal:AbortSignal.timeout(5000)});assert.equal(stream.status,200);reader=stream.body.getReader();await reader.read();const response=await fetch(base+'/api/rpc/unblock_ip',{method:'POST',headers:{Cookie:cookie,Origin:'https://portfolio.test','Content-Type':'application/json'},body:JSON.stringify({p_ip_address:deleted.ip_address})});assert.equal(response.status,200);const frame=await reader.read();const payload=JSON.parse(new TextDecoder().decode(frame.value).split('data: ')[1]);assert.deepEqual(payload.old,deleted);assert.equal(payload.eventType,'DELETE');}finally{await reader?.cancel();await app.close();}
});

test('analytics summaries require admin before accessing aggregate data',async()=>{
 const app=await setup();
 try{const response=await app.inject({method:'POST',url:'/api/analytics/summary',headers:{origin:'https://portfolio.test'},payload:{timeRange:'all',page:'all'}});assert.equal(response.statusCode,403);}finally{await app.close();}
});

test('successful and failed login logs use the dashboard contract',async()=>{
 const {hashPassword}=await import('../security.mjs');
 const password='a secure password 2026';const hash=await hashPassword(password);const logs=[];
 const database={query:async(sql,values)=>{
  if(sql.includes('count(*)'))return {rows:[{count:0}]};
  if(sql.includes('SELECT * FROM app_users'))return {rows:[{id:'user-1',email:'owner@test.com',password_hash:hash,verified:true}]};
  if(sql.includes('INSERT INTO content_records'))logs.push(JSON.parse(values[2]));
  return {rows:[]};
 }};
 const app=await buildApp({db:database,config:{origin:'https://portfolio.test',cookieSecret:'a'.repeat(64),uploadDir:'/not-used'}});
 try{
  for(const [value,status]of [[password,200],['wrong password',401]]){
   const response=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'https://portfolio.test'},payload:{email:'owner@test.com',password:value}});assert.equal(response.statusCode,status);
  }
  assert.deepEqual(logs.map(({action,success,identifier})=>({action,success,identifier})),[{action:'login',success:true,identifier:'owner@test.com'},{action:'login',success:false,identifier:'owner@test.com'}]);
 }finally{await app.close();}
});

test('legacy security logs and studies normalize without inventing success',async()=>{
 const {normalizeRecord}=await import('../records.mjs');
 assert.equal(normalizeRecord('ip_logs',{event_type:'login_success',email:'a@test.com'}).success,true);
 assert.equal(normalizeRecord('ip_logs',{event_type:'login_failed'}).success,false);
 assert.equal(normalizeRecord('ip_logs',{}).success,null);
 const row=normalizeRecord('portfolio_project_content',{project_key:'a',overview:'Context'});
 assert.deepEqual(row.challenges,[]);assert.equal(row.summary,'');
});

test('public snapshot includes only public resources and preserves empty catalogs',async()=>{
 const database={query:async(sql,params)=>{
  if(sql.includes('resource=ANY')){assert.ok(!params[0].includes('ip_logs'));return {rows:[{resource:'portfolio_project_content',data:{project_key:'a'}}]};}
  return {rows:[]};
 }};
 const app=await buildApp({db:database,config:{origin:'https://portfolio.test',cookieSecret:'a'.repeat(64),uploadDir:'/not-used'}});
 try{const response=await app.inject('/api/public-content');assert.equal(response.statusCode,200);const {data}=response.json();assert.deepEqual(data.projects,[]);assert.equal(data.ip_logs,undefined);assert.deepEqual(data.portfolio_project_content[0].challenges,[]);}finally{await app.close();}
});
