-- Função para registrar movimentação de estoque automaticamente
CREATE OR REPLACE FUNCTION register_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status do pedido mudou para 'completed' ou 'delivered', dar baixa no estoque
  IF (TG_OP = 'UPDATE' AND OLD.order_status != NEW.order_status 
      AND NEW.order_status IN ('completed', 'delivered')
      AND NEW.product_id IS NOT NULL) THEN
    
    DECLARE
      current_stock INTEGER;
      buyer_name TEXT;
    BEGIN
      -- Pegar estoque atual
      SELECT stock_quantity INTO current_stock 
      FROM products 
      WHERE id = NEW.product_id;
      
      -- Pegar nome do comprador
      SELECT full_name INTO buyer_name 
      FROM profiles 
      WHERE id = NEW.buyer_id;
      
      -- Dar baixa no estoque
      UPDATE products 
      SET stock_quantity = stock_quantity - NEW.quantity 
      WHERE id = NEW.product_id;
      
      -- Registrar movimentação
      INSERT INTO stock_movements (
        partner_id,
        product_id,
        order_id,
        movement_type,
        quantity,
        previous_quantity,
        new_quantity,
        reference_type,
        reference_name,
        notes,
        created_by
      ) VALUES (
        NEW.partner_id,
        NEW.product_id,
        NEW.id,
        'sale',
        -NEW.quantity,
        current_stock,
        current_stock - NEW.quantity,
        'customer',
        COALESCE(buyer_name, 'Cliente'),
        'Baixa automática - Pedido ' || NEW.order_number,
        NEW.buyer_id
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS order_status_stock_movement ON orders;
CREATE TRIGGER order_status_stock_movement
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION register_stock_movement();
