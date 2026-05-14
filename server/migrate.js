const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ai_analyses table - persist all AI responses
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(255),
        entity_id INTEGER,
        result TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // audit_log table - FERPA audit logging
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(100),
        resource VARCHAR(100),
        resource_id VARCHAR(100),
        details JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add school_id to domain tables (multi-tenancy)
    const domainTables = [
      'threat_assessments', 'incident_reports', 'behavioral_analyses',
      'mental_health_screenings', 'visitor_logs', 'safety_audits',
      'training_programs', 'bullying_reports', 'anonymous_tips',
      'drill_records', 'access_control_logs', 'communication_alerts',
      'weapon_detections', 'community_risks', 'emergency_plans'
    ];

    for (const table of domainTables) {
      await client.query(`
        ALTER TABLE IF EXISTS ${table}
        ADD COLUMN IF NOT EXISTS school_id INTEGER
      `).catch(e => console.log(`Note: ${table}: ${e.message}`));
    }

    // Add status to threat_assessments for triage workflow
    await client.query(`
      ALTER TABLE IF EXISTS threat_assessments
      ADD COLUMN IF NOT EXISTS triage_status VARCHAR(50) DEFAULT 'reported'
    `).catch(() => {});

    // Add simulation_state to drill_records
    await client.query(`
      ALTER TABLE IF EXISTS drill_records
      ADD COLUMN IF NOT EXISTS simulation_state JSONB
    `).catch(() => {});

    // Add submitter_hash to anonymous_tips for deduplication
    await client.query(`
      ALTER TABLE IF EXISTS anonymous_tips
      ADD COLUMN IF NOT EXISTS submitter_hash VARCHAR(64)
    `).catch(() => {});

    // Add risk_score to visitor_logs if not exists
    await client.query(`
      ALTER TABLE IF EXISTS visitor_logs
      ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0
    `).catch(() => {});

    // Add ai_analysis to all domain tables
    for (const table of domainTables) {
      await client.query(`
        ALTER TABLE IF EXISTS ${table}
        ADD COLUMN IF NOT EXISTS ai_analysis TEXT
      `).catch(() => {});
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

migrate().catch(console.error).finally(() => pool.end());
