-- Tabela de perfis de usuário (referência ao auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Tabela de parceiros (lojas)
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  store_name text not null,
  store_description text,
  address text not null,
  business_type text not null check (business_type in ('pf', 'pj')),
  cnpj text,
  opening_hours jsonb,
  store_image_url text,
  is_active boolean default true,
  sells_products boolean default false,
  provides_services boolean default false,
  rents_items boolean default false,
  has_reservable_spaces boolean default false,
  rating numeric(3,2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.partners enable row level security;

create policy "partners_select_all"
  on public.partners for select
  using (true);

create policy "partners_insert_own"
  on public.partners for insert
  with check (auth.uid() = user_id);

create policy "partners_update_own"
  on public.partners for update
  using (auth.uid() = user_id);

create policy "partners_delete_own"
  on public.partners for delete
  using (auth.uid() = user_id);

-- Meios de pagamento aceitos pelo parceiro
create table if not exists public.partner_payment_methods (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade not null,
  payment_method text not null,
  created_at timestamp with time zone default now()
);

alter table public.partner_payment_methods enable row level security;

create policy "payment_methods_select_all"
  on public.partner_payment_methods for select
  using (true);

create policy "payment_methods_insert_own"
  on public.partner_payment_methods for insert
  with check (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "payment_methods_delete_own"
  on public.partner_payment_methods for delete
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

-- Tabela de produtos
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  stock_quantity integer not null default 0,
  category text,
  images jsonb,
  is_active boolean default true,
  rating numeric(3,2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.products enable row level security;

create policy "products_select_all"
  on public.products for select
  using (true);

create policy "products_insert_own"
  on public.products for insert
  with check (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "products_update_own"
  on public.products for update
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "products_delete_own"
  on public.products for delete
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

-- Tabela de serviços
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  duration_minutes integer,
  category text,
  images jsonb,
  is_active boolean default true,
  rating numeric(3,2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.services enable row level security;

create policy "services_select_all"
  on public.services for select
  using (true);

create policy "services_insert_own"
  on public.services for insert
  with check (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "services_update_own"
  on public.services for update
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "services_delete_own"
  on public.services for delete
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

-- Tabela de itens para alugar
create table if not exists public.rental_items (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade not null,
  name text not null,
  description text,
  price_per_day numeric(10,2) not null,
  quantity_available integer not null default 1,
  category text,
  images jsonb,
  is_active boolean default true,
  rating numeric(3,2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.rental_items enable row level security;

create policy "rental_items_select_all"
  on public.rental_items for select
  using (true);

create policy "rental_items_insert_own"
  on public.rental_items for insert
  with check (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "rental_items_update_own"
  on public.rental_items for update
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "rental_items_delete_own"
  on public.rental_items for delete
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

-- Tabela de locais reserváveis
create table if not exists public.reservable_spaces (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade not null,
  name text not null,
  description text,
  price_per_hour numeric(10,2) not null,
  capacity integer,
  amenities jsonb,
  images jsonb,
  is_active boolean default true,
  rating numeric(3,2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.reservable_spaces enable row level security;

create policy "reservable_spaces_select_all"
  on public.reservable_spaces for select
  using (true);

create policy "reservable_spaces_insert_own"
  on public.reservable_spaces for insert
  with check (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "reservable_spaces_update_own"
  on public.reservable_spaces for update
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "reservable_spaces_delete_own"
  on public.reservable_spaces for delete
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

-- Tabela de clientes (para o ERP)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.customers enable row level security;

create policy "customers_select_own"
  on public.customers for select
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "customers_insert_own"
  on public.customers for insert
  with check (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "customers_update_own"
  on public.customers for update
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "customers_delete_own"
  on public.customers for delete
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

-- Tabela de fornecedores
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  address text,
  cnpj text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.suppliers enable row level security;

create policy "suppliers_select_own"
  on public.suppliers for select
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "suppliers_insert_own"
  on public.suppliers for insert
  with check (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "suppliers_update_own"
  on public.suppliers for update
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "suppliers_delete_own"
  on public.suppliers for delete
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

-- Tabela de endereços salvos do usuário
create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.user_addresses enable row level security;

create policy "addresses_select_own"
  on public.user_addresses for select
  using (auth.uid() = user_id);

create policy "addresses_insert_own"
  on public.user_addresses for insert
  with check (auth.uid() = user_id);

create policy "addresses_update_own"
  on public.user_addresses for update
  using (auth.uid() = user_id);

create policy "addresses_delete_own"
  on public.user_addresses for delete
  using (auth.uid() = user_id);

-- Tabela de pedidos
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  buyer_id uuid references public.profiles(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null not null,
  product_id uuid references public.products(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  rental_item_id uuid references public.rental_items(id) on delete set null,
  space_id uuid references public.reservable_spaces(id) on delete set null,
  quantity integer not null default 1,
  total_amount numeric(10,2) not null,
  delivery_type text check (delivery_type in ('delivery', 'pickup')),
  delivery_address text,
  payment_method text not null,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'cancelled')),
  order_status text default 'pending' check (order_status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.orders enable row level security;

create policy "orders_select_buyer"
  on public.orders for select
  using (auth.uid() = buyer_id);

create policy "orders_select_partner"
  on public.orders for select
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "orders_insert_buyer"
  on public.orders for insert
  with check (auth.uid() = buyer_id);

create policy "orders_update_partner"
  on public.orders for update
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

-- Tabela de avaliações
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  partner_id uuid references public.partners(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  rental_item_id uuid references public.rental_items(id) on delete cascade,
  space_id uuid references public.reservable_spaces(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now()
);

alter table public.reviews enable row level security;

create policy "reviews_select_all"
  on public.reviews for select
  using (true);

create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "reviews_update_own"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "reviews_delete_own"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- Tabela de contas a pagar
create table if not exists public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  description text not null,
  amount numeric(10,2) not null,
  due_date date not null,
  paid_date date,
  status text default 'pending' check (status in ('pending', 'paid', 'overdue')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.accounts_payable enable row level security;

create policy "accounts_payable_select_own"
  on public.accounts_payable for select
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "accounts_payable_insert_own"
  on public.accounts_payable for insert
  with check (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "accounts_payable_update_own"
  on public.accounts_payable for update
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "accounts_payable_delete_own"
  on public.accounts_payable for delete
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

-- Tabela de contas a receber
create table if not exists public.accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  description text not null,
  amount numeric(10,2) not null,
  due_date date not null,
  received_date date,
  status text default 'pending' check (status in ('pending', 'received', 'overdue')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.accounts_receivable enable row level security;

create policy "accounts_receivable_select_own"
  on public.accounts_receivable for select
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "accounts_receivable_insert_own"
  on public.accounts_receivable for insert
  with check (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "accounts_receivable_update_own"
  on public.accounts_receivable for update
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );

create policy "accounts_receivable_delete_own"
  on public.accounts_receivable for delete
  using (
    exists (
      select 1 from partners
      where id = partner_id and user_id = auth.uid()
    )
  );
