const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const TABLE = 'community_risks';
const SYSTEM_PROMPT = `You are a community safety and risk assessment expert. Respond ONLY with valid JSON:
{
  "severity": "low|medium|high|critical",
  "proximity_assessment": "assessment text",
  "school_impact": "impact description",
  "mitigation_strategies": ["strategy1", "strategy2"],
  "community_partnerships": ["partner1"],
  "communication_plan": "plan text",
  "monitoring_schedule": "schedule description",
  "law_enforcement_coordination": "coordination notes"
}`;

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const [dataRes, countRes] = await Promise.all([
      pool.query(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      pool.query(`SELECT COUNT(*) FROM ${TABLE}`),
    ]);
    const total = parseInt(countRes.rows[0].count);
    res.json({ data: dataRes.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { risk_type, description, location, risk_level, status, source, mitigation_plan } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (risk_type, description, location, risk_level, status, source, mitigation_plan)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [risk_type, description, location, risk_level, status || 'active', source, mitigation_plan]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { risk_type, description, location, risk_level, status, source, mitigation_plan } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET risk_type=$1, description=$2, location=$3, risk_level=$4, status=$5, source=$6, mitigation_plan=$7
       WHERE id=$8 RETURNING *`,
      [risk_type, description, location, risk_level, status, source, mitigation_plan, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { next(error); }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const item = result.rows[0];
    const userPrompt = `Community Risk: ${item.risk_type}, Description: ${item.description}, Location: ${item.location}, Level: ${item.risk_level}`;
    const parsed = await askAI(SYSTEM_PROMPT, userPrompt, true);
    const analysis = parsed ? JSON.stringify(parsed) : userPrompt;
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, item.id]);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'community/analyze', item.id, analysis]).catch(() => {});
    res.json({ analysis: parsed || analysis });
  } catch (error) { next(error); }
});

module.exports = router;
