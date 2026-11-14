/** Aggregate in PostgreSQL so dashboard totals never depend on a row limit. */
export async function analyticsSummary(db, { timeRange = '30d', page = 'all' } = {}) {
  const days = { '7d': 7, '30d': 30, '90d': 90, all: null };
  if (!Object.hasOwn(days, timeRange) || typeof page !== 'string' || (page !== 'all' && (!page.startsWith('/') || page.length > 300))) {
    throw Object.assign(new Error('Filter analytics tidak valid.'), { statusCode: 400 });
  }
  const { rows } = await db.query(`
    WITH visits AS (
      SELECT data->>'page_path' AS page, NULLIF(data->>'visitor_id','') AS visitor,
        (data->>'created_at')::timestamptz AS visited_at,
        ((data->>'created_at')::timestamptz AT TIME ZONE 'Asia/Jakarta')::date AS visit_date,
        NULLIF(regexp_replace(data->>'referrer', '^https?://([^/:?#]+).*$', '\\1', 'i'), '') AS referrer
      FROM content_records
      WHERE resource='page_analytics'
        AND ($1::integer IS NULL OR (data->>'created_at')::timestamptz >= now()-make_interval(days => $1::integer))
        AND ($2::text='all' OR data->>'page_path'=$2)
    ), pages AS (SELECT page,count(*)::integer AS views FROM visits GROUP BY page ORDER BY views DESC,page LIMIT 5),
    dates AS (SELECT visit_date,count(*)::integer AS views FROM visits GROUP BY visit_date ORDER BY visit_date DESC LIMIT 14),
    referrers AS (SELECT lower(referrer) AS referrer,count(*)::integer AS count FROM visits WHERE referrer IS NOT NULL GROUP BY lower(referrer) ORDER BY count DESC,referrer LIMIT 5)
    SELECT jsonb_build_object(
      'totalViews',count(*), 'uniqueVisitors',count(DISTINCT visitor),
      'avgViewsPerDay',round(count(*)::numeric / COALESCE($1::integer, greatest(1, (now() AT TIME ZONE 'Asia/Jakarta')::date-min(visit_date)+1))),
      'viewsByPage',COALESCE((SELECT jsonb_agg(pages) FROM pages),'[]'::jsonb),
      'viewsByDate',COALESCE((SELECT jsonb_agg(jsonb_build_object('date',visit_date,'views',views) ORDER BY visit_date) FROM dates),'[]'::jsonb),
      'topReferrers',COALESCE((SELECT jsonb_agg(referrers) FROM referrers),'[]'::jsonb)
    ) AS summary FROM visits`, [days[timeRange], page]);
  return rows[0].summary;
}
