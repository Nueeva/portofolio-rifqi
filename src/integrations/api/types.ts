export interface User {id:string;email:string;created_at:string}
export interface Session {user:User}

import type { ProjectEditorial, SkillGroup } from '@/data/editorial';
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export interface ProjectRecord {
  id: string; title: string; problem: string; solution: string; category: string;
  tech_stack: string[]; github_url: string | null; demo_url: string | null; image_url: string | null;
  created_at: string; updated_at: string;
}
export interface IPLog {
  id: string; action: string; identifier: string | null; success: boolean | null;
  ip_address: string; user_agent: string | null; created_at: string;
  country?: string | null; city?: string | null; region?: string | null; isp?: string | null;
}
export interface AnalyticsSummary {
  totalViews: number; uniqueVisitors: number; avgViewsPerDay: number;
  viewsByPage: {page: string; views: number}[];
  viewsByDate: {date: string; views: number}[];
  topReferrers: {referrer: string; count: number}[];
}
interface Certification {
  id: string; name: string; issuer: string; year: string; status: string;
  credential_url: string | null; image_url: string | null; created_at: string; updated_at: string;
}
interface SiteSetting {
  setting_key: string; setting_value: string; id?: string; category?: string; label?: string;
  created_at?: string; updated_at?: string;
}
interface ActivityLog {
  id: string; user_id: string; action: string; entity_type: string; entity_id: string | null;
  entity_title: string | null; details: Json | null; created_at: string;
}
interface BlockedIP {
  id: string; ip_address: string; reason: string; blocked_at: string; expires_at: string; created_by: string | null;
}
type Table<R, I = Partial<R>, U = Partial<Omit<R, 'id'>>> = {Row: R; Insert: I; Update: U};
export interface ApiTables {
  projects: Table<ProjectRecord, Pick<ProjectRecord, 'title' | 'problem' | 'solution' | 'category' | 'tech_stack'> & Partial<ProjectRecord>>;
  certifications: Table<Certification, Pick<Certification, 'name' | 'issuer' | 'year'> & Partial<Certification>>;
  site_settings: Table<SiteSetting, Pick<SiteSetting, 'setting_key' | 'setting_value'> & Partial<SiteSetting>, Partial<Omit<SiteSetting, 'id' | 'setting_key'>>>;
  portfolio_project_content: Table<ProjectEditorial, ProjectEditorial, Partial<Omit<ProjectEditorial, 'project_key'>>>;
  portfolio_skill_groups: Table<SkillGroup, SkillGroup>;
  activity_logs: Table<ActivityLog, Pick<ActivityLog, 'user_id' | 'action' | 'entity_type'> & Partial<ActivityLog>>;
  blocked_ips: Table<BlockedIP, never, never>;
  ip_logs: Table<IPLog, never, never>;
  page_analytics: Table<{id: string; page_path: string; visitor_id: string; referrer: string | null; user_agent: string | null; created_at: string}, never, never>;
}

export interface PublicContent {
  projects: ProjectRecord[];
  portfolio_project_content: ProjectEditorial[];
  portfolio_skill_groups: SkillGroup[];
  site_settings: SiteSetting[];
  certifications: Certification[];
}
