const fields={projects:['id','title','problem','solution','tech_stack','category','github_url','demo_url','image_url','created_at','updated_at'],certifications:['id','name','issuer','year','status','credential_url','image_url','created_at','updated_at'],site_settings:['id','setting_key','setting_value','category','label','created_at','updated_at'],portfolio_project_content:['project_key','summary','featured','sort_order','role','period','overview','challenges','approach','outcomes','lessons'],portfolio_skill_groups:['id','title','items','sort_order'],activity_logs:['id','user_id','action','entity_type','entity_id','entity_title','details','created_at']};
export function validateRecord(resource,value,partial=false){
 const allowed=fields[resource]?[...fields[resource],"created_at","updated_at"]:null;if(!allowed||!value||typeof value!=='object'||Array.isArray(value))return false;
 if(Object.keys(value).some(k=>!allowed.includes(k)))return false;
 for(const [key,field]of Object.entries(value)){
  if(['tech_stack','items','challenges','approach','outcomes'].includes(key)){if(!Array.isArray(field)||field.length>200||field.some(v=>typeof v!=='string'||v.length>12000))return false;}
  else if(key==='sort_order'){if(!Number.isInteger(field)||Math.abs(field)>100000)return false;}
  else if(key==='featured'){if(typeof field!=='boolean')return false;}
  else if(key==='details'){if(field!==null&&typeof field!=='object')return false;}
  else if(field!==null&&(typeof field!=='string'||field.length>20000))return false;
 }
 if(value.category&&resource==='projects'&&!['tools','web-security','pentesting'].includes(value.category))return false;
 if(partial)return !('id'in value)&&!('setting_key'in value)&&!('project_key'in value);
 const required={projects:['title','problem','solution','category','tech_stack'],certifications:['name','issuer','year'],site_settings:['setting_key','setting_value'],portfolio_project_content:['project_key','overview','featured','sort_order'],portfolio_skill_groups:['id','title','items','sort_order'],activity_logs:['action','entity_type']}[resource];
 return required.every(key=>value[key]!==undefined&&value[key]!==null);
}
