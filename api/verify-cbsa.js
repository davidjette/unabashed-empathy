const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gNhrxuR1Uv8S@ep-bold-star-aeeibsjz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const r = await pool.query(`
    SELECT COUNT(*) as total,
      COUNT(cbsa_name) FILTER (WHERE cbsa_name IS NOT NULL AND cbsa_name != '') as has_cbsa,
      COUNT(DISTINCT cbsa_name) FILTER (WHERE cbsa_name IS NOT NULL AND cbsa_name != '') as distinct_metros,
      COUNT(*) FILTER (WHERE metro_area IS NOT NULL AND metro_area != '') as has_metro_area
    FROM housing_stats
  `);
  console.log('Coverage:', JSON.stringify(r.rows[0], null, 2));

  const s = await pool.query(`
    SELECT zip_code, state_abbr, county_name, cbsa_code, cbsa_name, metro_area
    FROM housing_stats WHERE cbsa_name IS NOT NULL AND cbsa_name != ''
    ORDER BY population DESC NULLS LAST LIMIT 10
  `);
  console.log('\nTop ZIPs by pop:');
  s.rows.forEach(r => console.log(`  ${r.zip_code} ${r.state_abbr} | ${r.county_name || '—'} | cbsa=${r.cbsa_name} | metro=${r.metro_area || 'NULL'}`));

  // Check rural (no CBSA)
  const rural = await pool.query(`
    SELECT zip_code, state_abbr, county_name FROM housing_stats
    WHERE (cbsa_name IS NULL OR cbsa_name = '') AND state_abbr IS NOT NULL
    ORDER BY population DESC NULLS LAST LIMIT 5
  `);
  console.log('\nTop rural (no CBSA):');
  rural.rows.forEach(r => console.log(`  ${r.zip_code} ${r.state_abbr} | ${r.county_name || '—'}`));

  await pool.end();
})();
