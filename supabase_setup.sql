-- ========================================================
-- CONFIGURATION SUPABASE POUR LE PORTFOLIO DE BENJAMIN MINKO
-- A copier et coller dans Supabase > SQL Editor > New query > Run
-- ========================================================

-- 1. Creation de la table des publications
create table if not exists public.projects (
  id text primary key,
  title text not null,
  category text not null,
  type text default 'projet',
  description text default '',
  details text default '',
  technologies text default '',
  site text default '',
  demo text default '',
  github text default '',
  image text default '',
  imageAlt text default '',
  artwork text default '',
  author text default '',
  bookTitle text default '',
  quote text default '',
  bibleRef text default '',
  verseText text default '',
  created_at timestamptz default now()
);

-- 2. Activation de la securite (Row Level Security)
alter table public.projects enable row level security;

-- Politiques de securite :
create policy "Lecture publique des publications"
  on public.projects for select
  using (true);

create policy "Insertion publications"
  on public.projects for insert
  with check (true);

create policy "Modification publications"
  on public.projects for update
  using (true)
  with check (true);

create policy "Suppression publications"
  on public.projects for delete
  using (true);

-- 3. Bucket de stockage pour les photos et illustrations
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

create policy "Affichage public des photos"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');

create policy "Upload des photos"
  on storage.objects for insert
  with check (bucket_id = 'portfolio-media');

create policy "Suppression des photos"
  on storage.objects for delete
  using (bucket_id = 'portfolio-media');

-- 4. Insertion initiale de vos 3 projets existants
insert into public.projects (id, title, category, type, description, details, technologies, artwork)
values 
  (
    'original-web',
    'Un espace pour collaborer.',
    'Web',
    'projet',
    'Une plateforme collaborative et son tableau de bord, pour explorer les liens entre interface et donn?es.',
    'Ce projet r?unit une architecture client-serveur, la gestion des ?tats, l?authentification et des visualisations de donn?es. C?t? outils : JavaScript, Node.js, bases de donn?es et API REST.',
    'Node.js ? JavaScript',
    'web'
  ),
  (
    'original-data',
    'Explorer l?incertitude.',
    'Actuariat & data',
    'projet',
    'Des outils de simulation et d?analyse pour mieux comprendre les risques et mod?liser des sc?narios.',
    'Ce travail s?appuie sur les m?thodes actuarielles : calculs de probabilit?s, distributions statistiques et projections financi?res. R?alis? avec Python et des biblioth?ques de calcul scientifique.',
    'Python ? Probabilit?s ? Analyse de donn?es',
    'data'
  ),
  (
    'original-ia',
    'Faire dialoguer les connaissances.',
    'IA',
    'projet',
    'Un assistant pens? pour explorer et synth?tiser des documents complexes de mani?re interactive.',
    'Le syst?me combine recherche s?mantique, traitement du langage naturel et structuration de r?ponses contextualis?es. Objectif : transformer une masse d?informations en synth?se claire.',
    'Python ? Traitement du langage ? API IA',
    'ia'
  )
on conflict (id) do nothing;
