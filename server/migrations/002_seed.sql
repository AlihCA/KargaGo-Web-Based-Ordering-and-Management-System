INSERT INTO products (name, description, price, category, image_url, stock, in_stock) VALUES
('Express Delivery', 'Guaranteed delivery within 24 hours', 299.99, 'express', 'https://example.com/express.jpg', 25, true),
('Standard Delivery', 'Delivery within 3-5 business days', 149.99, 'snacks', 'https://example.com/standard.jpg', 120, true),
('Economy Delivery', 'Delivery within 7-10 business days', 79.99, 'economy', 'https://example.com/economy.jpg', 0, false),
('Same Day Delivery', 'Delivery on the same day', 499.99, 'express', 'https://example.com/sameday.jpg', 8, true)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price),
  category = VALUES(category),
  image_url = VALUES(image_url),
  stock = VALUES(stock),
  in_stock = VALUES(in_stock);
