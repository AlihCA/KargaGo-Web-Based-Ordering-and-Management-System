INSERT INTO products (name, description, price, category, image_url, stock, in_stock) VALUES 
(
  'Express Delivery',
  'Guaranteed delivery within 24 hours',
  299.99,
  'express',
  'https://www.kulturafilipino.com/cdn/shop/products/IMG8834_1800x1800.jpg?v=1654683806',
  25,
  true
),

(
  'Standard Delivery',
  'Delivery within 3-5 business days',
  149.99,
  'snacks',
  '/client/products/bukayo.jpg',
  120,
  true
),
(
  'Economy Delivery',
  'Delivery within 7-10 business days',
  79.99,
  'economy',
  'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=800&q=80',
  0,
  false
),
(
  'Same Day Delivery',
  'Delivery on the same day',
  499.99,
  'express',
  'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?auto=format&fit=crop&w=800&q=80',
  8,
  true
)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price),
  category = VALUES(category),
  image_url = VALUES(image_url),
  stock = VALUES(stock),
  in_stock = VALUES(in_stock);

