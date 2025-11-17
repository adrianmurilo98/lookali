-- Remover o trigger antigo que usa order_status
drop trigger if exists order_status_stock_movement on public.orders;
drop function if exists public.handle_order_stock_movement();

-- Remover o trigger antigo de pagamento se existir
drop trigger if exists update_stock_on_payment on public.orders;
drop function if exists public.handle_payment_stock_update();

-- Criar função para atualizar estoque quando pedido for marcado como pago
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
  -- Verificar se o pedido foi marcado como pago usando a coluna 'situation'
  if new.situation = 'paid' and (old.situation is null or old.situation != 'paid') then
    -- Buscar o produto do pedido
    select * into v_product from public.products where id = new.product_id;
    
    if v_product.id is not null then
      -- Calcular quantidades
      v_previous_qty := v_product.stock_quantity;
      v_new_qty := v_product.stock_quantity - new.quantity;
      
      -- Atualizar estoque do produto
      update public.products
      set stock_quantity = stock_quantity - new.quantity
      where id = new.product_id;
      
      -- Registrar movimentação de estoque
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
        new.quantity,
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

-- Criar trigger para executar quando pedido for atualizado
create trigger update_stock_on_payment
  after update on public.orders
  for each row
  execute function public.handle_payment_stock_update();
