import {test} from 'node:test';import assert from 'node:assert/strict';import {hashPassword,verifyPassword,safeStoragePath,validEmail} from '../security.mjs';import {validateRecord} from '../records.mjs';
test('password hashing rejects incorrect credentials and uses a unique salt',async()=>{const first=await hashPassword('a secure password 2026');const second=await hashPassword('a secure password 2026');assert.notEqual(first,second);assert.ok(await verifyPassword('a secure password 2026',first));assert.equal(await verifyPassword('wrong',first),false);});
test('storage keys reject traversal and absolute paths',()=>{for(const path of ['../secret','/etc/passwd','a/../b','a//b','a/./b','a\\b'])assert.equal(safeStoragePath(path),false,path);assert.ok(safeStoragePath('thumbnails/abc-123.webp'));});
test('mail addresses reject header/recipient injection',()=>{for(const email of ['a,b@example.com','a@example.com\r\nBcc:evil@test.com','x<y@example.com>'])assert.equal(validEmail(email),false,email);assert.ok(validEmail('owner+portfolio@example.com'));});
test('record writes validate fields and prevent identity mutation',()=>{assert.equal(validateRecord('projects',{title:'test',problem:'p',solution:'s',category:'Web Security',tech_stack:[]}),false);assert.equal(validateRecord('projects',{title:'test',problem:'p',solution:'s',category:'tools',tech_stack:[]}),true);assert.equal(validateRecord('projects',{id:'other'},true),false);assert.equal(validateRecord('site_settings',{setting_value:'new'},true),true);assert.equal(validateRecord('portfolio_skill_groups',{id:'a',title:'skills',items:[3],sort_order:0}),false);});

test('content writes reject null required fields and incomplete studies', () => {
 for (const field of ['title','problem','solution','category','tech_stack']) assert.equal(validateRecord('projects',{[field]:null},true),false,field);
 for (const field of ['summary','overview','role','period','lessons','challenges','approach','outcomes']) assert.equal(validateRecord('portfolio_project_content',{[field]:null},true),false,field);
 assert.equal(validateRecord('portfolio_project_content',{project_key:'a',overview:'Context',featured:true,sort_order:0}),false);
 assert.equal(validateRecord('projects',{github_url:null},true),true);
});
