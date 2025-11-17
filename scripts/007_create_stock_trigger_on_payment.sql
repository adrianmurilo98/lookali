-- Trigger para dar baixa no estoque quando pedido for marcado como pago
create or replace function handle_order_payment()
returns trigger as $$
begin
  -- Corrigido para usar 'situation' ao invés de 'order_status'
  -- Se o pedido foi marcado como pago
  if new.situation = 'paid' and (old.situation is null or old.situation != 'paid') then
    -- Dar baixa nos produtos do pedido
    update products
    set stock_quantity = stock_quantity - oi.quantity
    from order_items oi
    where products.id = oi.product_id
      and oi.order_id = new.id
      and products.stock_quantity >= oi.quantity;
    
    -- Registrar movimentação de estoque para cada item
    insert into stock_movements (
      partner_id,
      product_id,
      order_id,
      movement_type,
      quantity,
      previous_quantity,
      new_quantity,
      reference_type,
      reference_name,
      notes
    )
    select 
      new.partner_id,
      oi.product_id,
      new.id,
      'sale',
      -oi.quantity,
      p.stock_quantity + oi.quantity,
      p.stock_quantity,
      'customer',
      'Pedido #' || new.order_number,
      'Venda realizada via pedido'
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = new.id;
  end if;
  
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_order_payment on orders;

create trigger on_order_payment
  after update on orders
  for each row
  execute function handle_order_payment();
