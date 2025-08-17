
const { Client } = require('pg');

async function verifyDatabase() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_ygZPzEhSBe80@ep-wispy-mode-acik8cvu-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    await client.connect();
    console.log('✅ Conexión exitosa a la base de datos');

    // Verificar estructura de products
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estructura de tabla products:');
    structure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Verificar productos
    const products = await client.query('SELECT COUNT(*) as count FROM products WHERE is_active = true');
    console.log(`\n📦 Productos activos: ${products.rows[0].count}`);

    // Verificar columnas críticas
    const nullCheck = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(image) as with_image,
        COUNT(updated_at) as with_updated_at
      FROM products;
    `);
    
    const stats = nullCheck.rows[0];
    console.log('\n🔍 Verificación de datos:');
    console.log(`  Total productos: ${stats.total}`);
    console.log(`  Con imagen: ${stats.with_image}`);
    console.log(`  Con updated_at: ${stats.with_updated_at}`);
    
    if (stats.total === stats.with_image && stats.total === stats.with_updated_at) {
      console.log('\n🎉 ¡Base de datos sincronizada correctamente!');
    } else {
      console.log('\n⚠️ Faltan datos en algunas columnas');
    }

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await client.end();
  }
}

verifyDatabase();
