const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'access_control_logs';
const SYSTEM_PROMPT = `You are a school physical security and access control expert. Analyze this access control log entry and provide:
1) Security assessment of the access event
2) Authorization compliance evaluation
3) Anomaly detection and red flags
4) Recommended security response actions
5) System improvement recommendations
6) Pattern analysis considerations
Focus on identifying potential security breaches and unauthorized access attempts.`;

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
    const { entry_point, person_type, access_method, timestamp, authorized, flagged, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (entry_point, person_type, access_method, timestamp, authorized, flagged, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [entry_point, person_type, access_method, timestamp || new Date(), authorized, flagged || false, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { entry_point, person_type, access_method, timestamp, authorized, flagged, notes } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET entry_point=$1, person_type=$2, access_method=$3, timestamp=$4, authorized=$5, flagged=$6, notes=$7
       WHERE id=$8 RETURNING *`,
      [entry_point, person_type, access_method, timestamp, authorized, flagged, notes, req.params.id]
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
    const userPrompt = `Access Control Log:\nEntry Point: ${item.entry_point}\nPerson Type: ${item.person_type}\nAccess Method: ${item.access_method}\nTimestamp: ${item.timestamp}\nAuthorized: ${item.authorized}\nFlagged: ${item.flagged}\nNotes: ${item.notes}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { entry_point, person_type, access_method, timestamp, authorized, flagged, notes } = req.body;
    const userPrompt = `Access Control Log:\nEntry Point: ${entry_point || 'N/A'}\nPerson Type: ${person_type || 'N/A'}\nAccess Method: ${access_method || 'N/A'}\nTimestamp: ${timestamp || 'N/A'}\nAuthorized: ${authorized}\nFlagged: ${flagged}\nNotes: ${notes || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
