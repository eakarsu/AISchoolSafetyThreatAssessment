const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const crypto = require('crypto');

const TABLE = 'visitor_logs';
const SYSTEM_PROMPT = `You are a school security visitor management expert. Respond ONLY with valid JSON:
{
  "risk_score": <integer 0-100>,
  "risk_level": "low|medium|high|critical",
  "red_flags": ["flag1", "flag2"],
  "compliance_evaluation": "evaluation text",
  "recommended_actions": ["action1", "action2"],
  "screening_improvements": "suggestions text"
}`;

router.use(auth);

// Deterministic risk scorer
function computeRiskScore(visitor) {
  let score = 0;
  // No ID: +30
  if (!visitor.id_verified) score += 30;
  // No host: +20
  if (!visitor.host_staff) score += 20;
  // Vague purpose: +10
  const vaguePurposes = ['unknown', 'other', 'n/a', ''];
  if (vaguePurposes.includes((visitor.purpose || '').toLowerCase())) score += 10;
  // Already has non-zero score: base it
  if (visitor.risk_score && visitor.risk_score > 0) score = Math.max(score, visitor.risk_score);
  return Math.min(100, score);
}

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

// POST / - create visitor with AI risk scorer
router.post('/', aiRateLimiter, async (req, res, next) => {
  try {
    const { visitor_name, purpose, host_staff, check_in, check_out, id_verified } = req.body;

    // Check repeated visits in last 30 days
    const recentVisits = await pool.query(
      `SELECT COUNT(*) FROM ${TABLE} WHERE visitor_name ILIKE $1 AND created_at > NOW() - INTERVAL '30 days'`,
      [visitor_name || '']
    );
    const visitCount = parseInt(recentVisits.rows[0].count);

    // Deterministic base score
    const baseScore = computeRiskScore({ visitor_name, purpose, host_staff, id_verified });

    // AI narrative risk assessment
    const aiPrompt = `Visitor: ${visitor_name}, Purpose: ${purpose}, Host: ${host_staff}, ID Verified: ${id_verified}, Recent visits in 30 days: ${visitCount}. Visit count above 3 raises concern.`;
    const parsed = await askAI(SYSTEM_PROMPT, aiPrompt, true);

    let finalScore = baseScore;
    if (visitCount > 3) finalScore = Math.min(100, finalScore + 25);
    if (parsed && typeof parsed.risk_score === 'number') {
      finalScore = Math.round((finalScore + parsed.risk_score) / 2);
    }

    const result = await pool.query(
      `INSERT INTO ${TABLE} (visitor_name, purpose, host_staff, check_in, check_out, id_verified, risk_score, ai_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [visitor_name, purpose, host_staff, check_in, check_out, id_verified, finalScore, parsed ? JSON.stringify(parsed) : null]
    );

    await pool.query(
      `INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'visitors/create', result.rows[0].id, JSON.stringify(parsed)]
    ).catch(() => {});

    res.status(201).json({ ...result.rows[0], ai_risk: parsed });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { visitor_name, purpose, host_staff, check_in, check_out, id_verified, risk_score } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET visitor_name=$1, purpose=$2, host_staff=$3, check_in=$4, check_out=$5, id_verified=$6, risk_score=$7
       WHERE id=$8 RETURNING *`,
      [visitor_name, purpose, host_staff, check_in, check_out, id_verified, risk_score, req.params.id]
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
    const userPrompt = `Visitor Log Entry:\nVisitor: ${item.visitor_name}\nPurpose: ${item.purpose}\nHost: ${item.host_staff}\nCheck-in: ${item.check_in}\nID Verified: ${item.id_verified}\nRisk Score: ${item.risk_score}`;
    const parsed = await askAI(SYSTEM_PROMPT, userPrompt, true);
    const analysis = parsed ? JSON.stringify(parsed) : userPrompt;
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'visitors/analyze', item.id, analysis]).catch(() => {});
    res.json({ analysis: parsed || analysis });
  } catch (error) { next(error); }
});

module.exports = router;
