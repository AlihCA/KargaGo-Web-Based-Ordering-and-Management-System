DROP TRIGGER IF EXISTS products_before_insert;
DROP TRIGGER IF EXISTS products_before_update;

CREATE TRIGGER products_before_insert
BEFORE INSERT ON products
FOR EACH ROW
SET NEW.in_stock = (NEW.stock > 0);

CREATE TRIGGER products_before_update
BEFORE UPDATE ON products
FOR EACH ROW
SET NEW.in_stock = (NEW.stock > 0);
