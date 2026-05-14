const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const TABLE = 'weapon_detections';
const SYSTEM_PROMPT = `You are a school security weapons detection and response expert. Respond ONLY with valid JSON:
{
  "threat_severity": "low|medium|high|critical",
  "response_adequacy": "appropriate|insufficient|excessive",
  "investigation_steps": ["step1", "step2"],
  "policy_improvements": ["improvement1"],
  "detection_effectiveness": "effectiveness assessment",
  "law_enforcement_needed": <boolean>,
  "community_communication": "communication strategy"
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
    const { detection_type, location, description, weapon_type, action_taken, law_enforcement_called, status } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (detection_type, location, description, weapon_type, action_taken, law_enforcement_called, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [detection_type, location, description, weapon_type, action_taken, law_enforcement_called, status || 'reported']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { detection_type, location, description, weapon_type, action_taken, law_enforcement_called, status } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET detection_type=$1, location=$2, description=$3, weapon_type=$4, action_taken=$5, law_enforcement_called=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [detection_type, location, description, weapon_type, action_taken, law_enforcement_called, status, req.params.id]
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
    const userPrompt = `Weapon Detection: Type: ${item.detection_type}, Weapon: ${item.weapon_type}, Location: ${item.location}, Action: ${item.action_taken}`;
    const parsed = await askAI(SYSTEM_PROMPT, userPrompt, true);
    const analysis = parsed ? JSON.stringify(parsed) : userPrompt;
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, item.id]);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'weapons/analyze', item.id, analysis]).catch(() => {});
    res.json({ analysis: parsed || analysis });
  } catch (error) { next(error); }
});

module.exports = router;
