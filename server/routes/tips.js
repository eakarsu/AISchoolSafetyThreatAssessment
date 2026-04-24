const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'anonymous_tips';
const SYSTEM_PROMPT = `You are a school safety intelligence analyst specializing in anonymous tip evaluation. Analyze this anonymous tip and provide:
1) Credibility assessment (based on detail, specificity, and consistency)
2) Urgency and priority classification
3) Recommended investigation steps
4) Immediate safety actions needed (if any)
5) Resources and personnel to involve
6) Follow-up verification strategies
Treat every tip seriously while maintaining objectivity. Err on the side of caution for student safety.`;

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
    const { tip_category, message, priority, status, location_hint } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (tip_category, message, priority, status, location_hint)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [tip_category, message, priority, status || 'new', location_hint]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { tip_category, message, priority, status, location_hint } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET tip_category=$1, message=$2, priority=$3, status=$4, location_hint=$5
       WHERE id=$6 RETURNING *`,
      [tip_category, message, priority, status, location_hint, req.params.id]
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
    const userPrompt = `Anonymous Tip:\nCategory: ${item.tip_category}\nMessage: ${item.message}\nPriority: ${item.priority}\nStatus: ${item.status}\nLocation Hint: ${item.location_hint}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { tip_category, message, priority, location_hint } = req.body;
    const userPrompt = `Anonymous Tip:\nCategory: ${tip_category || 'N/A'}\nMessage: ${message || 'N/A'}\nPriority: ${priority || 'N/A'}\nLocation Hint: ${location_hint || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
