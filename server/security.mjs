import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto';import {promisify} from 'node:util';
const derive=promisify(scrypt);export const digest=value=>createHash('sha256').update(value).digest('hex');export const token=()=>randomBytes(32).toString('hex');
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');const key=await derive(password,salt,64);return `${salt}:${key.toString('hex')}`;}
export async function verifyPassword(password,stored){const [salt,encoded]=stored.split(':');if(!salt||!encoded)return false;const expected=Buffer.from(encoded,'hex');const actual=await derive(password,salt,64);return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export function safeStoragePath(value){return typeof value==='string'&&value.length<300&&/^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/.test(value)&&!value.split('/').some(p=>p==='..'||p==='.'||p==='');}
export const publicResources=new Set(['projects','certifications','site_settings','portfolio_project_content','portfolio_skill_groups']);
export const privateResources=new Set(['activity_logs','page_analytics','blocked_ips','ip_logs']);
export function allowedResource(name){return publicResources.has(name)||privateResources.has(name);}
export function validEmail(value){return typeof value==='string'&&value.length<=254&&/^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,63}$/i.test(value);}
