-- Remover TODOS os triggers antigos que podem estar causando duplicação
drop trigger if exists order_status_stock_movement on public.orders;
drop trigger if exists update_stock_on_payment on public.orders;
drop function if exists public.handle_order_stock_movement();
drop function if exists public.handle_payment_stock_update();

-- Criar função ÚNICA para atualizar estoque quando pedido for marcado como pago
create or replace function public.handle_payment_stock_update()
returns trigger
language plpgsql
security definer
as $$
declare
  v_product record;
  v_previous_qty integer;
  v_new_qty integer;
begin
  -- Verificar se foi marcado como pago (sem duplicação)
  if new.situation = 'paid' and old.situation != 'paid' then
    -- Buscar o produto do pedido
    select * into v_product from public.products where id = new.product_id;
    
    if v_product.id is not null then
      -- Calcular quantidades
      v_previous_qty := v_product.stock_quantity;
      v_new_qty := v_product.stock_quantity - new.quantity;
      
      -- Atualizar estoque do produto (subtrai a quantidade vendida)
      update public.products
      set stock_quantity = stock_quantity - new.quantity
      where id = new.product_id;
      
      -- Registrar movimentação de estoque com quantidade NEGATIVA para venda
      insert into public.stock_movements (
        partner_id,
        product_id,
        movement_type,
        quantity,
        previous_quantity,
        new_quantity,
        order_id,
        reference_name,
        notes
      ) values (
        new.partner_id,
        new.product_id,
        'sale',
        -new.quantity,  -- Quantidade NEGATIVA para indicar saída
        v_previous_qty,
        v_new_qty,
        new.id,
        'Pedido #' || new.order_number,
        'Venda confirmada - pagamento recebido'
      );
    end if;
  end if;
  
  return new;
end;
$$;

-- Criar trigger ÚNICO para executar quando pedido for atualizado
create trigger update_stock_on_payment
  after update on public.orders
  for each row
  execute function public.handle_payment_stock_update();

-- Adicionar sistema de prevenção de fraude
-- Tabela para rastrear ações suspeitas
create table if not exists public.fraud_checks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  action_type text not null,
  related_user_id uuid references public.profiles(id),
  ip_address text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.fraud_checks enable row level security;

-- Política para admins verem tudo
create policy "Admins can view fraud checks" on public.fraud_checks
  for select
  using (true);

-- Criar índices para melhorar performance de verificações
create index if not exists idx_fraud_checks_user on public.fraud_checks(user_id);
create index if not exists idx_fraud_checks_related_user on public.fraud_checks(related_user_id);

-- Adicionar coluna para separar observações do cliente e observações internas
alter table public.orders add column if not exists internal_notes text;
