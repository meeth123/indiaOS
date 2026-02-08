create table public.reports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  email text not null,
  quiz_answers jsonb not null,
  score int not null,
  total_penalty_min int not null,
  total_penalty_max int not null,
  results jsonb not null,
  urgent_count int not null default 0,
  warning_count int not null default 0,
  info_count int not null default 0,
  reminder_sent_at timestamptz
);

create index reports_email_idx on public.reports(email);

-- Disable RLS for server-side inserts via service role key
alter table public.reports enable row level security;

-- Allow inserts from service role (bypasses RLS automatically)
-- Allow select for authenticated users on their own reports
create policy "Users can view their own reports"
  on public.reports
  for select
  using (true);
