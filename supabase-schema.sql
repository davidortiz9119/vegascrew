-- ============================================================
-- VegasCrew Supabase Setup
-- Run this in your Supabase SQL editor to create all tables
-- ============================================================

-- ATTENDEES table
create table if not exists attendees (
  id bigserial primary key,
  name text not null,
  status text not null check (status in ('in', 'maybe', 'out')),
  plus_one text default '',
  created_at timestamptz default now()
);

-- HOTEL VOTES table
create table if not exists hotel_votes (
  id bigserial primary key,
  option text not null,
  voter text default 'Anonymous',
  created_at timestamptz default now()
);

-- WEEKEND VOTES table
create table if not exists weekend_votes (
  id bigserial primary key,
  option text not null,
  voter text default 'Anonymous',
  created_at timestamptz default now()
);

-- COMMENTS / CHAT table
create table if not exists comments (
  id bigserial primary key,
  author text default 'Anonymous',
  message text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS) + allow public read/write
-- (fine for a private friend group site — all data is non-sensitive)

alter table attendees enable row level security;
alter table hotel_votes enable row level security;
alter table weekend_votes enable row level security;
alter table comments enable row level security;

create policy "Allow all" on attendees for all using (true) with check (true);
create policy "Allow all" on hotel_votes for all using (true) with check (true);
create policy "Allow all" on weekend_votes for all using (true) with check (true);
create policy "Allow all" on comments for all using (true) with check (true);

-- Enable realtime
alter publication supabase_realtime add table attendees;
alter publication supabase_realtime add table hotel_votes;
alter publication supabase_realtime add table weekend_votes;
alter publication supabase_realtime add table comments;
