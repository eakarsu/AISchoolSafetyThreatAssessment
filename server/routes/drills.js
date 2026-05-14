const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const TABLE = 'drill_records';
const SYSTEM_PROMPT = `You are a school emergency drill evaluation expert. Respond ONLY with valid JSON:
{
  "performance_rating": <integer 1-10>,
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "recommendations": ["rec1", "rec2"],
  "compliance_status": "compliant|partial|non-compliant",
  "next_drill_focus": "focus area description"
}`;

const SIM_SYSTEM = `You are an AI incident commander running an emergency drill simulation for school staff. You play the incident commander role. Respond ONLY with valid JSON:
{
  "event": "description of what is happening in the scenario",
  "situation": "current situation summary",
  "question": "what should staff do now?",
  "options": ["option A", "option B", "option C"],
  "phase": "phase name"
}`;

const EVAL_SYSTEM = `You are an AI drill evaluator. Evaluate the staff response to a drill scenario. Respond ONLY with valid JSON:
{
  "evaluation": "evaluation of the staff response",
  "score": <integer 1-10>,
  "feedback": "specific feedback",
  "next_event": "description of next scenario event",
  "next_question": "what should staff do next?",
  "next_options": ["option A", "option B", "option C"],
  "drill_complete": <boolean>
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
    const { drill_type, date, duration_minutes, participants, issues_found, rating, next_drill } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (drill_type, date, duration_minutes, participants, issues_found, rating, next_drill)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [drill_type, date, duration_minutes, participants, issues_found, rating, next_drill]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { drill_type, date, duration_minutes, participants, issues_found, rating, next_drill } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET drill_type=$1, date=$2, duration_minutes=$3, participants=$4, issues_found=$5, rating=$6, next_drill=$7
       WHERE id=$8 RETURNING *`,
      [drill_type, date, duration_minutes, participants, issues_found, rating, next_drill, req.params.id]
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
    const userPrompt = `Drill Record:\nDrill Type: ${item.drill_type}\nDate: ${item.date}\nDuration: ${item.duration_minutes} minutes\nParticipants: ${item.participants}\nIssues Found: ${item.issues_found}\nRating: ${item.rating}`;
    const parsed = await askAI(SYSTEM_PROMPT, userPrompt, true);
    const analysis = parsed ? JSON.stringify(parsed) : userPrompt;
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, item.id]);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'drills/analyze', item.id, analysis]).catch(() => {});
    res.json({ analysis: parsed || analysis });
  } catch (error) { next(error); }
});

// POST /:id/simulate - start interactive drill simulation
router.post('/:id/simulate', aiRateLimiter, async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const drill = result.rows[0];

    const userPrompt = `Start a drill simulation for drill type: "${drill.drill_type}". School setting. Generate the first scenario event that staff must respond to. Make it realistic and challenging.`;
    const event = await askAI(SIM_SYSTEM, userPrompt, true);

    await pool.query(`UPDATE ${TABLE} SET simulation_state = $1 WHERE id = $2`, [JSON.stringify({ started: true, events: [event] }), drill.id]).catch(() => {});

    res.json({ simulation_started: true, event });
  } catch (error) { next(error); }
});

// POST /:id/respond - respond to drill scenario
router.post('/:id/respond', aiRateLimiter, async (req, res, next) => {
  try {
    const { response, previous_event } = req.body;
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const drill = result.rows[0];
    const userPrompt = `Previous scenario event: ${JSON.stringify(previous_event)}\nStaff response: "${response}"\nDrill type: ${drill.drill_type}\nEvaluate the response and provide the next scenario event if drill is not complete.`;

    const evaluation = await askAI(EVAL_SYSTEM, userPrompt, true);

    res.json({ evaluation });
  } catch (error) { next(error); }
});

module.exports = router;
