const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'drill_records';
const SYSTEM_PROMPT = `You are a school emergency drill evaluation expert. Analyze this drill record and provide:
1) Performance rating assessment with justification
2) Identified strengths and areas for improvement
3) Specific recommendations for addressing issues found
4) Comparison against national benchmarks and best practices
5) Staff and student preparedness evaluation
6) Recommendations for next drill (focus areas, modifications)
7) Compliance with state and federal drill requirements
Be specific about timing, participation, and procedural adherence.`;

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} ORDER BY created_at DESC`);
    res.json(result.rows);
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

router.post('/:id/analyze', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const item = result.rows[0];
    const userPrompt = `Drill Record:\nDrill Type: ${item.drill_type}\nDate: ${item.date}\nDuration: ${item.duration_minutes} minutes\nParticipants: ${item.participants}\nIssues Found: ${item.issues_found}\nRating: ${item.rating}\nNext Drill: ${item.next_drill}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { drill_type, date, duration_minutes, participants, issues_found, rating } = req.body;
    const userPrompt = `Drill Record:\nDrill Type: ${drill_type || 'N/A'}\nDate: ${date || 'N/A'}\nDuration: ${duration_minutes || 'N/A'} minutes\nParticipants: ${participants || 'N/A'}\nIssues Found: ${issues_found || 'N/A'}\nRating: ${rating || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
