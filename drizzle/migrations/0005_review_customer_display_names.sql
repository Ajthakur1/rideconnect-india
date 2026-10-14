ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_name text;
UPDATE public.reviews r SET customer_name = regexp_replace(u.name, '^\s*Demo\s*:\s*', '', 'i') FROM public.users u WHERE u.id = r.customer_id;
CREATE OR REPLACE FUNCTION public.set_review_customer_name() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN SELECT regexp_replace(u.name, '^\s*Demo\s*:\s*', '', 'i') INTO NEW.customer_name FROM public.users u WHERE u.id = NEW.customer_id; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.set_review_customer_name() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER set_review_customer_display_name BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_review_customer_name();
COMMENT ON COLUMN public.reviews.customer_name IS 'Public review attribution only; populated from the review author without exposing private profile fields.';