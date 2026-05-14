const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const TABLE = 'mental_health_screenings';
const SYSTEM_PROMPT = `You are a school mental health professional. Respond ONLY with valid JSON:
{
  "risk_level": "low|moderate|high|critical",
  "immediate_safety_concern": <boolean>,
  "differential_considerations": ["consideration1", "consideration2"],
  "interventions": ["intervention1", "intervention2"],
  "safety_planning_needed": <boolean>,
  "referral_recommendations": ["referral1"],
  "follow_up_timeline": "timeline description",
  "family_engagement": "strategy text"
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
    await pool.query(`INSERT INTO audit_log (user_id, action, resource, details) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'READ', 'mental_health_screenings', JSON.stringify({ page, limit })]).catch(() => {});
    res.json({ data: dataRes.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    await pool.query(`INSERT INTO audit_log (user_id, action, resource, resource_id, details) VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, 'READ', 'mental_health_screenings', req.params.id, JSON.stringify({ student: result.rows[0].student_name })]).catch(() => {});
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET student_name=$1, grade=$2, screening_type=$3, risk_indicators=$4, recommendations=$5, follow_up_date=$6, counselor=$7
       WHERE id=$8 RETURNING *`,
      [student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor, req.params.id]
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
    await pool.query(`INSERT INTO audit_log (user_id, action, resource, resource_id, details) VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, 'AI_ANALYZE', 'mental_health_screenings', item.id, JSON.stringify({ student: item.student_name })]).catch(() => {});
    const userPrompt = `Student: ${item.student_name}, Grade: ${item.grade}, Screening: ${item.screening_type}, Risk Indicators: ${item.risk_indicators}, Counselor: ${item.counselor}`;
    const parsed = await askAI(SYSTEM_PROMPT, userPrompt, true);
    const analysis = parsed ? JSON.stringify(parsed) : userPrompt;
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, item.id]);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'mental-health/analyze', item.id, analysis]).catch(() => {});
    res.json({ analysis: parsed || analysis });
  } catch (error) { next(error); }
});

module.exports = router;
