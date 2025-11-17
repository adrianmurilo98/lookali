-- Criar tabela de carrinho
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  partner_id uuid references public.partners(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

alter table public.cart_items enable row level security;

create policy "cart_items_select_own"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "cart_items_insert_own"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

create policy "cart_items_update_own"
  on public.cart_items for update
  using (auth.uid() = user_id);

create policy "cart_items_delete_own"
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- Atualizar tabela de pedidos - remover order_status, renomear payment_status para situation
alter table public.orders drop column if exists order_status;
alter table public.orders rename column payment_status to situation;

-- Adicionar coluna para múltiplos produtos em um pedido
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null not null,
  product_name text not null,
  product_price numeric(10,2) not null,
  quantity integer not null,
  subtotal numeric(10,2) not null,
  created_at timestamp with time zone default now()
);

alter table public.order_items enable row level security;

create policy "order_items_select_buyer"
  on public.order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_id and orders.buyer_id = auth.uid()
    )
  );

create policy "order_items_select_partner"
  on public.order_items for select
  using (
    exists (
      select 1 from orders
      join partners on orders.partner_id = partners.id
      where orders.id = order_id and partners.user_id = auth.uid()
    )
  );

create policy "order_items_insert_buyer"
  on public.order_items for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_id and orders.buyer_id = auth.uid()
    )
  );
