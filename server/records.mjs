const fields = {
  projects: ['id', 'title', 'problem', 'solution', 'tech_stack', 'category', 'github_url', 'demo_url', 'image_url', 'created_at', 'updated_at'],
  certifications: ['id', 'name', 'issuer', 'year', 'status', 'credential_url', 'image_url', 'created_at', 'updated_at'],
  site_settings: ['id', 'setting_key', 'setting_value', 'category', 'label', 'created_at', 'updated_at'],
  portfolio_project_content: ['project_key', 'summary', 'featured', 'sort_order', 'role', 'period', 'overview', 'challenges', 'approach', 'outcomes', 'lessons'],
  portfolio_skill_groups: ['id', 'title', 'items', 'sort_order'],
  activity_logs: ['id', 'user_id', 'action', 'entity_type', 'entity_id', 'entity_title', 'details', 'created_at'],
};
const editorialStrings = ['summary', 'role', 'period', 'overview', 'lessons'];
const editorialLists = ['challenges', 'approach', 'outcomes'];
const nullable = new Set(['github_url', 'demo_url', 'image_url', 'credential_url', 'entity_id', 'entity_title', 'details']);

// Normalize pre-migration rows on reads; never silently repair new invalid writes.
export function normalizeRecord(resource, value) {
  if (resource === 'portfolio_project_content') {
    const row = { ...value };
    for (const key of editorialStrings) if (typeof row[key] !== 'string') row[key] = '';
    for (const key of editorialLists) row[key] = Array.isArray(row[key]) ? row[key].filter(v => typeof v === 'string') : [];
    row.featured = row.featured === true;
    row.sort_order = Number.isInteger(row.sort_order) ? row.sort_order : 0;
    return row;
  }
  if (resource === 'blocked_ips') return { ...value, created_by: value.created_by ?? null };
  if (resource === 'ip_logs') {
    return { ...value, action: value.action ?? 'login', identifier: value.identifier ?? value.email ?? null,
      success: typeof value.success === 'boolean' ? value.success : value.event_type === 'login_success' ? true : value.event_type === 'login_failed' ? false : null };
  }
  return value;
}

export function validateRecord(resource, value, partial = false) {
  const allowed = fields[resource] ? [...fields[resource], 'created_at', 'updated_at'] : null;
  if (!allowed || !value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (Object.keys(value).some(key => !allowed.includes(key))) return false;
  for (const [key, field] of Object.entries(value)) {
    if (field === null) { if (!nullable.has(key)) return false; continue; }
    if (['tech_stack', 'items', ...editorialLists].includes(key)) {
      if (!Array.isArray(field) || field.length > 200 || field.some(v => typeof v !== 'string' || v.length > 12000)) return false;
    } else if (key === 'sort_order') {
      if (!Number.isInteger(field) || Math.abs(field) > 100000) return false;
    } else if (key === 'featured') {
      if (typeof field !== 'boolean') return false;
    } else if (key === 'details') {
      if (typeof field !== 'object' || Array.isArray(field)) return false;
    } else if (typeof field !== 'string' || field.length > 20000) return false;
  }
  if ('category' in value && resource === 'projects' && !['tools', 'web-security', 'pentesting'].includes(value.category)) return false;
  if (partial) return !('id' in value) && !('setting_key' in value) && !('project_key' in value);
  const required = {
    projects: ['title', 'problem', 'solution', 'category', 'tech_stack'],
    certifications: ['name', 'issuer', 'year'], site_settings: ['setting_key', 'setting_value'],
    portfolio_project_content: ['project_key', 'featured', 'sort_order', ...editorialStrings, ...editorialLists],
    portfolio_skill_groups: ['id', 'title', 'items', 'sort_order'], activity_logs: ['action', 'entity_type'],
  }[resource];
  return required.every(key => value[key] !== undefined && value[key] !== null);
}
