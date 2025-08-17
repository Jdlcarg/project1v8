
-- Verificar estructura actual de la tabla products
\d products;

-- Agregar columnas faltantes si no existen
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT '';

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Actualizar productos existentes con valores por defecto
UPDATE products 
SET image = 'https://via.placeholder.com/300x300?text=Producto'
WHERE image = '' OR image IS NULL;

-- Verificar estructura final
\d products;
