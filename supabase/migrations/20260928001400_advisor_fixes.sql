ALTER FUNCTION public.immutable_array_to_string(text[], text) SET search_path = pg_catalog;

-- Extensions do not belong in the API-exposed schema; the trigram index opclass moves with it.
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

ALTER FUNCTION public.search_exercises(text, text, text, text, text, text, int, int)
  SET search_path = public, extensions, pg_temp;
