CREATE OR REPLACE FUNCTION public.admin_list_sellers()
RETURNS SETOF public.seller_profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.seller_profiles WHERE public.is_admin() ORDER BY created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.admin_list_sellers() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_sellers() TO authenticated;