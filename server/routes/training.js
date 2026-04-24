const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'training_programs';
const SYSTEM_PROMPT = `You are a school safety training and professional development expert. Analyze this training program and provide:
1) Training effectiveness assessment
2) Content gap analysis
3) Recommendations for improving engagement and completion rates
4) Alignment with current best practices and regulations
5) Assessment and certification recommendations
6) Follow-up training suggestions
Focus on measurable outcomes and practical application.`;

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
    const { title, category, description, target_audience, duration, completion_rate, next_session } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (title, category, description, target_audience, duration, completion_rate, next_session)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, category, description, target_audience, duration, completion_rate || 0, next_session]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { title, category, description, target_audience, duration, completion_rate, next_session } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET title=$1, category=$2, description=$3, target_audience=$4, duration=$5, completion_rate=$6, next_session=$7
       WHERE id=$8 RETURNING *`,
      [title, category, description, target_audience, duration, completion_rate, next_session, req.params.id]
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
    const userPrompt = `Training Program:\nTitle: ${item.title}\nCategory: ${item.category}\nDescription: ${item.description}\nTarget Audience: ${item.target_audience}\nDuration: ${item.duration}\nCompletion Rate: ${item.completion_rate}%\nNext Session: ${item.next_session}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { title, category, description, target_audience, duration, completion_rate } = req.body;
    const userPrompt = `Training Program:\nTitle: ${title || 'N/A'}\nCategory: ${category || 'N/A'}\nDescription: ${description || 'N/A'}\nTarget Audience: ${target_audience || 'N/A'}\nDuration: ${duration || 'N/A'}\nCompletion Rate: ${completion_rate || 'N/A'}%`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
