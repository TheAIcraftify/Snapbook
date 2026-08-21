-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- PROFILES: one row per authenticated user
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('customer', 'photographer', 'admin')),
  created_at timestamptz not null default now()
);

-- PHOTOGRAPHERS: verification + private contact fields
create table photographers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  phone text not null,
  email text not null,
  instagram text not null,
  portfolio_urls text[] not null default '{}',
  bio text default '',
  categories text[] not null default '{}',
  city text not null default '',
  price_range text default '',
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  rating numeric not null default 0,
  created_at timestamptz not null default now()
);

-- BOOKINGS
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references profiles(id) on delete cascade,
  photographer_id uuid not null references photographers(id) on delete cascade,
  event_date date not null,
  event_type text not null,
  location text not null,
  message text default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table photographers enable row level security;
alter table bookings enable row level security;

-- PROFILES policies
create policy "Users can view all profiles"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- PHOTOGRAPHERS policies
-- Public/customers can see verified photographers, but NEVER phone/email/instagram
-- (enforced at the app layer: public queries select only non-contact columns)
create policy "Anyone can view verified photographers"
  on photographers for select
  using (verification_status = 'verified' or user_id = auth.uid());

create policy "Photographers can insert their own profile"
  on photographers for insert
  with check (auth.uid() = user_id);

create policy "Photographers can update their own profile"
  on photographers for update
  using (auth.uid() = user_id);

-- BOOKINGS policies
create policy "Customers can view their own bookings"
  on bookings for select
  using (
    customer_id = auth.uid()
    or photographer_id in (select id from photographers where user_id = auth.uid())
  );

create policy "Customers can create bookings"
  on bookings for insert
  with check (customer_id = auth.uid());

create policy "Photographers can update booking status"
  on bookings for update
  using (photographer_id in (select id from photographers where user_id = auth.uid()));
