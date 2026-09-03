-- Selectable trophy badge for a league (1-4, matches public/images/winner-badge-#.svg).
-- Displayed on season winner rows and on the winner's public profile.
alter table public.leagues
  add column trophy_badge smallint not null default 1 check (trophy_badge between 1 and 4);
