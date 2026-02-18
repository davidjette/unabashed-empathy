const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gNhrxuR1Uv8S@ep-bold-star-aeeibsjz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});
(async () => {
  const r = await pool.query(`
    UPDATE housing_stats SET metro_area = cbsa_name, updated_at = NOW()
    WHERE cbsa_name IS NOT NULL AND cbsa_name != '' AND (metro_area IS NULL OR metro_area = '')
  `);
  console.log(`Synced cbsa_name → metro_area: ${r.rowCount} rows updated`);
  
  const v = await pool.query(`
    SELECT COUNT(*) FILTER (WHERE metro_area IS NOT NULL AND metro_area != '') as has_metro,
           COUNT(*) as total
    FROM housing_stats
  `);
  console.log(`metro_area: ${v.rows[0].has_metro}/${v.rows[0].total} (${(v.rows[0].has_metro/v.rows[0].total*100).toFixed(1)}%)`);
  await pool.end();
})();
