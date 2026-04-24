const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'incident_reports';
const SYSTEM_PROMPT = `You are a school safety incident analysis expert. Analyze this incident report and provide:
1) Severity assessment and classification
2) Root cause analysis
3) Recommended immediate response actions
4) Preventive measures to avoid recurrence
5) Documentation and follow-up requirements
6) Liability considerations
Be thorough, professional, and focused on preventing future incidents.`;

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

router.post('/:id/analyze', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const item = result.rows[0];
    const userPrompt = `Incident Report:\nTitle: ${item.title}\nType: ${item.incident_type}\nDescription: ${item.description}\nLocation: ${item.location}\nDate: ${item.date}\nSeverity: ${item.severity}\nStatus: ${item.status}\nReported By: ${item.reported_by}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { title, description, incident_type, location, date, severity, reported_by } = req.body;
    const userPrompt = `Incident Report:\nTitle: ${title || 'N/A'}\nType: ${incident_type || 'N/A'}\nDescription: ${description || 'N/A'}\nLocation: ${location || 'N/A'}\nDate: ${date || 'N/A'}\nSeverity: ${severity || 'N/A'}\nReported By: ${reported_by || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
