const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const SYSTEM_PROMPT = `You are a school safety threat assessment expert. Analyze this threat report and provide:
1) Threat level assessment (with justification)
2) Recommended immediate actions
3) Long-term mitigation strategies
4) Risk factors to monitor
5) Communication recommendations for staff and parents
Be thorough, professional, and prioritize student safety.`;

// GET / - list all
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM threat_assessments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { next(error); }
});

// GET /:id - get single
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM threat_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

// POST / - create
router.post('/', async (req, res, next) => {
  try {
    const { title, description, location, threat_level, status, reported_by } = req.body;
    const result = await pool.query(
      `INSERT INTO threat_assessments (title, description, location, threat_level, status, reported_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, location, threat_level || 'medium', status || 'open', reported_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

// PUT /:id - update
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, location, threat_level, status, reported_by } = req.body;
    const result = await pool.query(
      `UPDATE threat_assessments SET title=$1, description=$2, location=$3, threat_level=$4, status=$5, reported_by=$6
       WHERE id=$7 RETURNING *`,
      [title, description, location, threat_level, status, reported_by, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

// DELETE /:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM threat_assessments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { next(error); }
});

// POST /:id/analyze
router.post('/:id/analyze', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM threat_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const item = result.rows[0];

    const userPrompt = `Threat Assessment Report:
Title: ${item.title}
Description: ${item.description}
Location: ${item.location}
Current Threat Level: ${item.threat_level}
Status: ${item.status}
Reported By: ${item.reported_by}`;

    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query('UPDATE threat_assessments SET ai_analysis = $1 WHERE id = $2', [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

// POST /ai-analyze - analyze without saving
router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { title, description, location, threat_level, reported_by } = req.body;
    const userPrompt = `Threat Assessment Report:
Title: ${title || 'N/A'}
Description: ${description || 'N/A'}
Location: ${location || 'N/A'}
Current Threat Level: ${threat_level || 'N/A'}
Reported By: ${reported_by || 'N/A'}`;

    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
