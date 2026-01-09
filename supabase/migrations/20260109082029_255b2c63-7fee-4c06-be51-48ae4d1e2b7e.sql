-- Add a visit_date column for deduplication
ALTER TABLE public.page_analytics 
ADD COLUMN IF NOT EXISTS visit_date date;

-- Create trigger function to set visit_date before insert
CREATE OR REPLACE FUNCTION public.set_visit_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.visit_date := NEW.created_at::date;
  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS set_page_analytics_visit_date ON public.page_analytics;
CREATE TRIGGER set_page_analytics_visit_date
BEFORE INSERT ON public.page_analytics
FOR EACH ROW
EXECUTE FUNCTION public.set_visit_date();

-- Backfill existing records
UPDATE public.page_analytics SET visit_date = created_at::date WHERE visit_date IS NULL;

-- Delete duplicate records, keeping only the earliest entry per visitor per page per day
DELETE FROM public.page_analytics a
USING public.page_analytics b
WHERE a.id > b.id 
  AND a.visitor_id = b.visitor_id 
  AND a.page_path = b.page_path 
  AND a.visit_date = b.visit_date;

-- Now add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_analytics_unique_visit 
ON public.page_analytics (visitor_id, page_path, visit_date);