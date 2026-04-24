const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'communication_alerts';
const SYSTEM_PROMPT = `You are a school crisis communication specialist. Analyze this communication alert and provide:
1) Message clarity and effectiveness assessment
2) Audience appropriateness evaluation
3) Timing and urgency alignment
4) Tone and language recommendations
5) Follow-up communication needs
6) Multi-channel distribution recommendations
7) Legal and compliance considerations
Focus on clear, actionable communication that reduces panic while ensuring safety.`;

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
    const { alert_type, title, message, priority, target_audience, sent_at, status } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (alert_type, title, message, priority, target_audience, sent_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [alert_type, title, message, priority, target_audience, sent_at || new Date(), status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { alert_type, title, message, priority, target_audience, sent_at, status } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET alert_type=$1, title=$2, message=$3, priority=$4, target_audience=$5, sent_at=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [alert_type, title, message, priority, target_audience, sent_at, status, req.params.id]
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
    const userPrompt = `Communication Alert:\nAlert Type: ${item.alert_type}\nTitle: ${item.title}\nMessage: ${item.message}\nPriority: ${item.priority}\nTarget Audience: ${item.target_audience}\nSent At: ${item.sent_at}\nStatus: ${item.status}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { alert_type, title, message, priority, target_audience } = req.body;
    const userPrompt = `Communication Alert:\nAlert Type: ${alert_type || 'N/A'}\nTitle: ${title || 'N/A'}\nMessage: ${message || 'N/A'}\nPriority: ${priority || 'N/A'}\nTarget Audience: ${target_audience || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
