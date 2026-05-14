const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const TABLE = 'emergency_plans';
const SYSTEM_PROMPT = `You are an emergency preparedness expert for K-12 schools. Respond ONLY with valid JSON:
{
  "completeness_score": <integer 0-100>,
  "gaps_identified": ["gap1", "gap2"],
  "fema_alignment": "alignment assessment",
  "improvements": ["improvement1", "improvement2"],
  "training_needs": ["need1", "need2"],
  "communication_adequacy": "assessment text",
  "disability_considerations": "considerations text"
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
    const { plan_name, plan_type, description, procedures, last_reviewed, status } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (plan_name, plan_type, description, procedures, last_reviewed, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [plan_name, plan_type, description, procedures, last_reviewed, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { plan_name, plan_type, description, procedures, last_reviewed, status } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET plan_name=$1, plan_type=$2, description=$3, procedures=$4, last_reviewed=$5, status=$6
       WHERE id=$7 RETURNING *`,
      [plan_name, plan_type, description, procedures, last_reviewed, status, req.params.id]
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
    const userPrompt = `Emergency Plan: ${item.plan_name}, Type: ${item.plan_type}, Description: ${item.description}, Procedures: ${item.procedures}`;
    const parsed = await askAI(SYSTEM_PROMPT, userPrompt, true);
    const analysis = parsed ? JSON.stringify(parsed) : userPrompt;
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, item.id]);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'emergency/analyze', item.id, analysis]).catch(() => {});
    res.json({ analysis: parsed || analysis });
  } catch (error) { next(error); }
});

module.exports = router;
