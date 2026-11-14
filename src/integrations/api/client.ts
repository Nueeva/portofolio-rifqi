import type { ApiTables, AnalyticsSummary } from "./types";
import type { Session } from "./types";
type Tables=ApiTables;type Failure={message:string};type Result<T>={data:T|null;error:Failure|null};
async function request<T>(path:string,body?:unknown,method=body===undefined?"GET":"POST"):Promise<Result<T>>{
 try{const response=await fetch(`/api/${path}`,{method,credentials:"same-origin",headers:body instanceof FormData?{}:{"Content-Type":"application/json"},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)});const result=await response.json();return response.ok?result:{data:null,error:result.error&&typeof result.error==="object"&&typeof result.error.message==="string"?result.error:{message:typeof result.message==="string"?result.message:"Permintaan gagal."}};}catch{return {data:null,error:{message:"Layanan belum terhubung. Coba lagi nanti."}};}
}
class Query<R,I,U> implements PromiseLike<Result<R[]>> {
 private body:{operation:string;filters:{field:string;operator:string;value:unknown}[];values?:unknown;order?:{field:string;ascending:boolean};limit?:number}={operation:"select",filters:[]};
 constructor(private resource:string){}
 select(_columns="*"){return this;}
 order(field:string,options:{ascending?:boolean}={}){this.body.order={field,ascending:options.ascending!==false};return this;}
 limit(value:number){this.body.limit=value;return this;}
 eq(field:string,value:unknown){this.body.filters.push({field,operator:"eq",value});return this;}
 gte(field:string,value:unknown){this.body.filters.push({field,operator:"gte",value});return this;}
 in(field:string,value:unknown[]){this.body.filters.push({field,operator:"in",value});return this;}
 insert(values:I|I[]){this.body.operation="insert";this.body.values=values;return this;}
 upsert(values:I|I[],_options?:{onConflict?:string}){this.body.operation="upsert";this.body.values=values;return this;}
 update(values:U){this.body.operation="update";this.body.values=values;return this;}
 delete(){this.body.operation="delete";return this;}
 then<A=Result<R[]>,B=never>(resolve?:((value:Result<R[]>)=>A|PromiseLike<A>)|null,reject?:((reason:unknown)=>B|PromiseLike<B>)|null):Promise<A|B>{return request<R[]>(`data/${this.resource}`,this.body).then(resolve,reject);}
}
type AuthListener=(event:string,session:Session|null)=>void;
const listeners=new Set<AuthListener>();
function announce(session:Session|null,event:string){listeners.forEach(callback=>callback(event,session));}
async function login(body:unknown){const result=await request<{session:Session;user:Session["user"]}>("auth/login",body);if(!result.error)announce(result.data?.session??null,"SIGNED_IN");return result;}
class Channel {
 private source?:EventSource;
 private handlers:{table:string;event:string;callback:(payload:{new:unknown;old:unknown;eventType:string})=>void}[]=[];
 on(_type:string,filter:{table?:string;event?:string;[key:string]:unknown},callback:(payload:{new:unknown;old:unknown;eventType:string})=>void){this.handlers.push({table:filter.table??"",event:filter.event??"*",callback});return this;}
 subscribe(status?:(state:string)=>void){this.source=new EventSource("/api/events",{withCredentials:true});this.source.onopen=()=>status?.("SUBSCRIBED");this.source.onerror=()=>status?.("CHANNEL_ERROR");this.source.onmessage=event=>{try{const payload=JSON.parse(event.data);for(const handler of this.handlers)if(payload.table===handler.table&&(handler.event==="*"||handler.event===payload.eventType))handler.callback(payload);}catch{/* Ignore malformed frames. */}};return this;}
 close(){this.source?.close();}
}
export const api={
 analytics:{summary:(filters:{timeRange:"7d"|"30d"|"90d"|"all";page:string})=>request<AnalyticsSummary>("analytics/summary",filters)},
 from<K extends keyof Tables>(resource:K){return new Query<Tables[K]["Row"],Tables[K]["Insert"],Tables[K]["Update"]>(resource);},
 rpc:async(name:string,body:unknown)=>request<boolean>(`rpc/${name}`,body),
 functions:{invoke:async<T=Record<string,unknown>>(name:string,options:{body?:unknown}={})=>request<T>(`functions/${name}`,options.body??{})},
 auth:{
  onAuthStateChange(callback:AuthListener){listeners.add(callback);return {data:{subscription:{unsubscribe:()=>{listeners.delete(callback);}}}};},
  async getSession(){const result=await request<{session:Session|null}>("auth/session");return {data:result.data??{session:null},error:result.error};},
  signInWithPassword:login,
  signUp:(body:{email:string;password:string;options?:unknown})=>request("auth/signup",body),
  async signOut(){const result=await request("auth/logout",{});if(!result.error)announce(null,"SIGNED_OUT");return result;},
  resetPasswordForEmail:(email:string,_options?:unknown)=>request("auth/reset-request",{email}),
  async updateUser(body:{password:string}){const result=await request("auth/password",{...body,resetToken:new URLSearchParams(window.location.search).get("token")});if(!result.error){announce(null,"SIGNED_OUT");history.replaceState(null,"","/auth");}return result;}
 },
 storage:{from(bucket:string){return {
  upload:async(path:string,file:Blob,_options?:unknown)=>{const form=new FormData();form.append("file",file,"upload");return request<{path:string}>(`storage/${bucket}/upload?path=${encodeURIComponent(path)}`,form);},
  getPublicUrl:(path:string)=>({data:{publicUrl:`/api/storage/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`}}),
  remove:(paths:string[])=>request(`storage/${bucket}/remove`,{paths})
 };}},
 channel:(_name:string)=>new Channel(),
 async removeChannel(channel:Channel){channel.close();return "ok";}
};
// Compatibility export while legacy component vocabulary is retained; all calls use the same-origin API.
export const supabase=api;
