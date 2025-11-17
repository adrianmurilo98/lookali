-- Criar função para atualizar rating do parceiro baseado em todos os produtos/serviços
CREATE OR REPLACE FUNCTION update_partner_rating_from_all_items()
RETURNS TRIGGER AS $$
DECLARE
  v_partner_id UUID;
  v_avg_rating NUMERIC;
BEGIN
  -- Pegar o partner_id do review
  IF TG_OP = 'DELETE' THEN
    v_partner_id := OLD.partner_id;
  ELSE
    v_partner_id := NEW.partner_id;
  END IF;

  -- Calcular a média de todas as avaliações de todos os produtos/serviços do parceiro
  -- que têm pelo menos uma avaliação
  SELECT AVG(r.rating)
  INTO v_avg_rating
  FROM reviews r
  WHERE r.partner_id = v_partner_id
    AND r.rating IS NOT NULL;

  -- Atualizar o rating do parceiro
  IF v_avg_rating IS NOT NULL THEN
    UPDATE partners
    SET rating = v_avg_rating
    WHERE id = v_partner_id;
  ELSE
    -- Se não houver avaliações, definir rating como 0
    UPDATE partners
    SET rating = 0
    WHERE id = v_partner_id;
  END IF;

  -- Atualizar também o rating do produto se for review de produto
  IF TG_OP = 'DELETE' THEN
    IF OLD.product_id IS NOT NULL THEN
      UPDATE products
      SET rating = COALESCE((
        SELECT AVG(rating)
        FROM reviews
        WHERE product_id = OLD.product_id
          AND rating IS NOT NULL
      ), 0)
      WHERE id = OLD.product_id;
    END IF;
  ELSE
    IF NEW.product_id IS NOT NULL THEN
      UPDATE products
      SET rating = COALESCE((
        SELECT AVG(rating)
        FROM reviews
        WHERE product_id = NEW.product_id
          AND rating IS NOT NULL
      ), 0)
      WHERE id = NEW.product_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_partner_rating_trigger ON reviews;

-- Criar trigger para atualizar rating automaticamente
CREATE TRIGGER update_partner_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_partner_rating_from_all_items();
