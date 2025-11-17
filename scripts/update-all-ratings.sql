-- Script to recalculate all product and partner ratings based on existing reviews
-- Run this if you need to fix ratings after data migration or cleanup

-- Update all product ratings based on their reviews
UPDATE products p
SET rating = (
  SELECT AVG(r.rating)::numeric(3,2)
  FROM reviews r
  WHERE r.product_id = p.id
  AND r.rating IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 FROM reviews r 
  WHERE r.product_id = p.id 
  AND r.rating IS NOT NULL
);

-- Update all partner ratings based on all reviews of their products
UPDATE partners pt
SET rating = (
  SELECT AVG(r.rating)::numeric(3,2)
  FROM reviews r
  INNER JOIN products p ON r.product_id = p.id
  WHERE p.partner_id = pt.id
  AND r.rating IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 
  FROM reviews r
  INNER JOIN products p ON r.product_id = p.id
  WHERE p.partner_id = pt.id 
  AND r.rating IS NOT NULL
);

-- Reset ratings to 0 for products with no reviews
UPDATE products
SET rating = 0
WHERE rating IS NULL
OR NOT EXISTS (
  SELECT 1 FROM reviews r 
  WHERE r.product_id = products.id 
  AND r.rating IS NOT NULL
);

-- Reset ratings to 0 for partners with no reviews
UPDATE partners
SET rating = 0
WHERE rating IS NULL
OR NOT EXISTS (
  SELECT 1 
  FROM reviews r
  INNER JOIN products p ON r.product_id = p.id
  WHERE p.partner_id = partners.id 
  AND r.rating IS NOT NULL
);
