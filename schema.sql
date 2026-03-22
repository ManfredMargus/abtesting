-- ============================================================
-- AB Testing by Antoon - Schema SQL
-- Colle ce script dans Supabase > SQL Editor > Run
-- ============================================================

-- Sites (chaque client a un site)
create table if not exists sites (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  domain      text,
  api_key     text unique not null default replace(gen_random_uuid()::text, '-', ''),
  created_at  timestamptz default now()
);

-- Expériences A/B
create table if not exists experiments (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid references sites(id) on delete cascade,
  name          text not null,
  description   text,
  status        text not null default 'draft',  -- draft | running | paused | completed
  goal_type     text not null default 'pageview', -- pageview | click | custom
  goal_value    text,  -- URL pour pageview, sélecteur CSS pour click
  created_at    timestamptz default now(),
  started_at    timestamptz,
  ended_at      timestamptz
);

-- Variations (A = contrôle, B = test, etc.)
create table if not exists variants (
  id              uuid primary key default gen_random_uuid(),
  experiment_id   uuid references experiments(id) on delete cascade,
  name            text not null,
  weight          integer not null default 50,  -- % de trafic (total doit = 100)
  is_control      boolean not null default false,
  changes         jsonb not null default '[]',
  -- Format des changes :
  -- [{ "type": "css", "value": "h1 { color: red; }" },
  --  { "type": "html", "selector": "#hero", "value": "<h1>Nouveau titre</h1>" },
  --  { "type": "redirect", "value": "https://exemple.com/page-b" }]
  created_at      timestamptz default now()
);

-- Événements (vues + conversions)
create table if not exists events (
  id              uuid primary key default gen_random_uuid(),
  experiment_id   uuid references experiments(id) on delete cascade,
  variant_id      uuid references variants(id) on delete cascade,
  visitor_id      text not null,
  event_type      text not null,  -- 'view' | 'conversion'
  url             text,
  created_at      timestamptz default now()
);

-- Index pour les requêtes fréquentes
create index if not exists events_experiment_id_idx on events(experiment_id);
create index if not exists events_variant_id_idx    on events(variant_id);
create index if not exists events_visitor_id_idx    on events(visitor_id);
create index if not exists events_created_at_idx    on events(created_at);

-- Disable RLS (on gère l'accès via la service role key côté serveur)
alter table sites       disable row level security;
alter table experiments disable row level security;
alter table variants    disable row level security;
alter table events      disable row level security;
