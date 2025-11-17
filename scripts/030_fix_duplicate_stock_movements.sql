-- Remove todos os triggers duplicados que estão causando movimentações duplas
DROP TRIGGER IF EXISTS on_order_payment ON public.orders;
DROP TRIGGER IF EXISTS update_stock_on_payment ON public.orders;
DROP TRIGGER IF EXISTS order_status_stock_movement ON public.orders;

-- Remove as funções antigas
DROP FUNCTION IF EXISTS public.handle_order_payment();
DROP FUNCTION IF EXISTS public.handle_payment_stock_update();
DROP FUNCTION IF EXISTS public.handle_order_stock_movement();
DROP FUNCTION IF EXISTS public.register_stock_movement();

-- Criar função ÚNICA para atualizar estoque SOMENTE quando pedido for marcado como "paid"
CREATE OR REPLACE FUNCTION public.handle_payment_stock_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_previous_qty INTEGER;
  v_new_qty INTEGER;
BEGIN
  -- Executar SOMENTE quando mudar de outro status para "paid"
  IF NEW.situation = 'paid' AND (OLD.situation IS NULL OR OLD.situation != 'paid') THEN
    
    -- Loop através de todos os itens do pedido
    FOR v_item IN 
      SELECT oi.product_id, oi.quantity, p.stock_quantity
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- Calcular quantidades
      v_previous_qty := v_item.stock_quantity;
      v_new_qty := GREATEST(0, v_item.stock_quantity - v_item.quantity);
      
      -- Atualizar estoque do produto
      UPDATE public.products
      SET stock_quantity = v_new_qty
      WHERE id = v_item.product_id;
      
      -- Registrar UMA ÚNICA movimentação de estoque por produto
      INSERT INTO public.stock_movements (
        partner_id,
        product_id,
        movement_type,
        quantity,
        previous_quantity,
        new_quantity,
        order_id,
        reference_name,
        notes
      ) VALUES (
        NEW.partner_id,
        v_item.product_id,
        'sale',
        -v_item.quantity,
        v_previous_qty,
        v_new_qty,
        NEW.id,
        'Pedido ' || NEW.order_number,
        'Venda realizada via pedido'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger ÚNICO
CREATE TRIGGER update_stock_on_payment
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payment_stock_update();

-- Limpar movimentações duplicadas (manter apenas UMA por pedido e produto)
WITH ranked_movements AS (
  SELECT 
    id,
    order_id,
    product_id,
    ROW_NUMBER() OVER (
      PARTITION BY order_id, product_id 
      ORDER BY 
        CASE WHEN notes = 'Venda realizada via pedido' THEN 1 ELSE 2 END,
        created_at DESC
    ) AS rn
  FROM stock_movements
  WHERE order_id IS NOT NULL
    AND movement_type = 'sale'
)
DELETE FROM stock_movements
WHERE id IN (
  SELECT id FROM ranked_movements WHERE rn > 1
);

COMMENT ON FUNCTION public.handle_payment_stock_update() IS 'Atualiza estoque e cria UMA movimentação por produto quando pedido é marcado como pago';
