-- Adicionar coluna customer_name na tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Remover TODOS os triggers relacionados a estoque para evitar duplicação
DROP TRIGGER IF EXISTS order_status_stock_movement ON public.orders;
DROP TRIGGER IF EXISTS update_stock_on_payment ON public.orders;
DROP FUNCTION IF EXISTS public.handle_order_stock_movement();
DROP FUNCTION IF EXISTS public.handle_payment_stock_update();

-- Criar função ÚNICA para atualizar estoque SOMENTE quando pedido for marcado como "paid"
CREATE OR REPLACE FUNCTION public.handle_payment_stock_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_previous_qty INTEGER;
  v_new_qty INTEGER;
BEGIN
  -- Executar SOMENTE quando mudar de outro status para "paid"
  -- Evita duplicação se rodar o trigger novamente
  IF NEW.situation = 'paid' AND OLD.situation != 'paid' THEN
    
    -- Buscar o produto do pedido (se houver)
    IF NEW.product_id IS NOT NULL THEN
      SELECT * INTO v_product FROM public.products WHERE id = NEW.product_id;
      
      IF v_product.id IS NOT NULL THEN
        -- Calcular quantidades
        v_previous_qty := v_product.stock_quantity;
        v_new_qty := v_product.stock_quantity - NEW.quantity;
        
        -- Atualizar estoque do produto (subtrai a quantidade vendida)
        UPDATE public.products
        SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
        WHERE id = NEW.product_id;
        
        -- Registrar movimentação de estoque com quantidade NEGATIVA para venda
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
          NEW.product_id,
          'sale',
          -NEW.quantity,  -- Quantidade NEGATIVA para indicar saída
          v_previous_qty,
          v_new_qty,
          NEW.id,
          'Pedido #' || NEW.order_number,
          'Venda confirmada - pagamento recebido'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger ÚNICO para executar SOMENTE quando pedido for atualizado
CREATE TRIGGER update_stock_on_payment
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payment_stock_update();

-- Limpar movimentações de estoque duplicadas (manter apenas a mais recente de cada pedido)
WITH ranked_movements AS (
  SELECT 
    id,
    order_id,
    ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC) AS rn
  FROM stock_movements
  WHERE order_id IS NOT NULL
    AND movement_type = 'sale'
)
DELETE FROM stock_movements
WHERE id IN (
  SELECT id FROM ranked_movements WHERE rn > 1
);

COMMENT ON FUNCTION public.handle_payment_stock_update() IS 'Atualiza estoque e cria movimentação ÚNICA quando pedido é marcado como pago';
