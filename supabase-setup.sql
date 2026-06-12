-- Run this in your Supabase SQL Editor

create table if not exists rooms (
  id text primary key,
  phase text not null default 'waiting',
  player1 jsonb,
  player2 jsonb,
  results jsonb,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table rooms enable row level security;

-- Allow all operations (adjust for production)
create policy "Allow all" on rooms for all using (true) with check (true);

-- Enable realtime on rooms table
alter publication supabase_realtime add table rooms;
