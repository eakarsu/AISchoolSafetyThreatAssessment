const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const TABLE = 'incident_reports';
const SYSTEM_PROMPT = `You are a school safety incident analysis expert. Respond ONLY with valid JSON:
{
  "severity": "low|medium|high|critical",
  "classification": "classification text",
  "root_causes": ["cause1", "cause2"],
  "immediate_actions": ["action1", "action2"],
  "preventive_measures": ["measure1", "measure2"],
  "documentation_requirements": ["req1"],
  "liability_considerations": "liability text"
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
    const { title, description, incident_type, location, date, severity, status, reported_by } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (title, description, incident_type, location, date, severity, status, reported_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, incident_type, location, date, severity, status || 'reported', reported_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, incident_type, location, date, severity, status, reported_by } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET title=$1, description=$2, incident_type=$3, location=$4, date=$5, severity=$6, status=$7, reported_by=$8
       WHERE id=$9 RETURNING *`,
      [title, description, incident_type, location, date, severity, status, reported_by, req.params.id]
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
    const userPrompt = `Incident: ${item.title}, Type: ${item.incident_type}, Description: ${item.description}, Location: ${item.location}, Severity: ${item.severity}`;
    const parsed = await askAI(SYSTEM_PROMPT, userPrompt, true);
    const analysis = parsed ? JSON.stringify(parsed) : userPrompt;
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, item.id]);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'incidents/analyze', item.id, analysis]).catch(() => {});
    res.json({ analysis: parsed || analysis });
  } catch (error) { next(error); }
});

module.exports = router;
