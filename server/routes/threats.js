const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const TABLE = 'threat_assessments';
const SYSTEM_PROMPT = `You are a school safety threat assessment expert. Respond ONLY with valid JSON in this exact format:
{
  "threat_level": "low|medium|high|critical",
  "summary": "Brief 2-sentence summary",
  "immediate_actions": ["action1", "action2", "action3"],
  "long_term_strategies": ["strategy1", "strategy2"],
  "risk_factors": ["factor1", "factor2"],
  "communication_recommendations": "Recommendation for staff and parents"
}`;

// Apply auth to all routes
router.use(auth);

// GET / - list with pagination
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const schoolId = req.user.school_id;

    const whereClause = schoolId ? 'WHERE school_id = $3' : '';
    const params = schoolId ? [limit, offset, schoolId] : [limit, offset];

    const [dataRes, countRes] = await Promise.all([
      pool.query(`SELECT * FROM ${TABLE} ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, params),
      pool.query(`SELECT COUNT(*) FROM ${TABLE} ${whereClause}`, schoolId ? [schoolId] : []),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({
      data: dataRes.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
});

// GET /:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

// POST /
router.post('/', async (req, res, next) => {
  try {
    const { title, description, location, threat_level, status, reported_by } = req.body;
    const schoolId = req.user.school_id || null;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (title, description, location, threat_level, status, reported_by, school_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description, location, threat_level || 'medium', status || 'reported', reported_by, schoolId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

// PUT /:id
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, location, threat_level, status, reported_by } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET title=$1, description=$2, location=$3, threat_level=$4, status=$5, reported_by=$6
       WHERE id=$7 RETURNING *`,
      [title, description, location, threat_level, status, reported_by, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

// PUT /:id/status - threat triage workflow
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['reported', 'investigating', 'escalated', 'resolved'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    const roleAllowed = ['counselor', 'admin'].includes(req.user.role);
    if (!roleAllowed) {
      return res.status(403).json({ error: 'Only counselors and admins can update threat status' });
    }

    const result = await pool.query(
      `UPDATE ${TABLE} SET status=$1 WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    // Auto-create alert when escalated
    if (status === 'escalated') {
      const threat = result.rows[0];
      await pool.query(
        `INSERT INTO communication_alerts (alert_type, title, message, priority, target_audience, status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        ['safety', `ESCALATED: ${threat.title}`, `Threat has been escalated. Location: ${threat.location}. Immediate action required.`, 'critical', 'all_staff', 'sent']
      ).catch(() => {}); // non-fatal
    }

    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

// DELETE /:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { next(error); }
});

// POST /:id/analyze
router.post('/:id/analyze', aiRateLimiter, async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const item = result.rows[0];

    const userPrompt = `Threat Assessment Report:
Title: ${item.title}
Description: ${item.description}
Location: ${item.location}
Current Threat Level: ${item.threat_level}
Status: ${item.status}
Reported By: ${item.reported_by}`;

    const parsed = await askAI(SYSTEM_PROMPT, userPrompt, true);
    const analysis = parsed ? JSON.stringify(parsed) : userPrompt;

    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);

    // Persist to ai_analyses
    await pool.query(
      `INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'threats/analyze', item.id, analysis]
    ).catch(() => {});

    res.json({ analysis: parsed || analysis });
  } catch (error) { next(error); }
});

module.exports = router;
