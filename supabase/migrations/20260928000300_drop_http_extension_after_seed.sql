-- Outbound HTTP from SQL is only needed for the one-off catalog seed; remove the attack surface.
DROP EXTENSION IF EXISTS http;
