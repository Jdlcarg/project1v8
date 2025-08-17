
-- Agregar columna updated_at si no existe
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Actualizar productos existentes con image desde image_url
UPDATE products 
SET image = COALESCE(image, image_url, 'https://via.placeholder.com/300x300?text=Producto')
WHERE image IS NULL OR image = '';

-- Actualizar todos los updated_at con la fecha actual
UPDATE products 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Verificar estructura final
\d products;

-- Verificar que todos los productos tengan imagen
SELECT id, name, image, image_url FROM products;
