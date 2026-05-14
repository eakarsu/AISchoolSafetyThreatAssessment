const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const TABLE = 'communication_alerts';
const SYSTEM_PROMPT = `You are a school crisis communication specialist. Respond ONLY with valid JSON:
{
  "clarity_score": <integer 0-100>,
  "audience_appropriateness": "appropriate|needs adjustment",
  "tone_assessment": "assessment text",
  "follow_up_needed": <boolean>,
  "distribution_channels": ["channel1", "channel2"],
  "legal_compliance": "compliance notes",
  "improved_message": "suggested improved message text"
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
    const { alert_type, title, message, priority, target_audience, sent_at, status } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (alert_type, title, message, priority, target_audience, sent_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [alert_type, title, message, priority, target_audience, sent_at || new Date(), status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { alert_type, title, message, priority, target_audience, sent_at, status } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET alert_type=$1, title=$2, message=$3, priority=$4, target_audience=$5, sent_at=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [alert_type, title, message, priority, target_audience, sent_at, status, req.params.id]
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
    const userPrompt = `Alert: ${item.title}, Type: ${item.alert_type}, Message: ${item.message}, Priority: ${item.priority}, Audience: ${item.target_audience}`;
    const parsed = await askAI(SYSTEM_PROMPT, userPrompt, true);
    const analysis = parsed ? JSON.stringify(parsed) : userPrompt;
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, item.id]);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'alerts/analyze', item.id, analysis]).catch(() => {});
    res.json({ analysis: parsed || analysis });
  } catch (error) { next(error); }
});

module.exports = router;
