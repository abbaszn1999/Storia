-- Drop content_calendar table
-- Late.dev is now the single source of truth for scheduled posts
-- See server/calendar/ for the new calendar implementation

DROP TABLE IF EXISTS content_calendar;
