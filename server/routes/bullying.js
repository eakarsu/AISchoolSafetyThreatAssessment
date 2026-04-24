const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'bullying_reports';
const SYSTEM_PROMPT = `You are a school anti-bullying specialist and child safety expert. Analyze this bullying report and provide:
1) Severity assessment and type classification
2) Immediate safety measures for the victim
3) Evidence-based intervention strategies for the aggressor
4) Recommended disciplinary actions aligned with school policy
5) Support resources for all parties involved
6) Monitoring plan to prevent recurrence
7) Legal considerations if applicable (Title IX, criminal behavior)
Prioritize the victim's safety and emotional well-being while considering restorative justice approaches.`;

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
    const { reporter_type, victim_grade, bully_grade, incident_type, description, location, action_taken } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (reporter_type, victim_grade, bully_grade, incident_type, description, location, action_taken)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [reporter_type, victim_grade, bully_grade, incident_type, description, location, action_taken]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { reporter_type, victim_grade, bully_grade, incident_type, description, location, action_taken } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET reporter_type=$1, victim_grade=$2, bully_grade=$3, incident_type=$4, description=$5, location=$6, action_taken=$7
       WHERE id=$8 RETURNING *`,
      [reporter_type, victim_grade, bully_grade, incident_type, description, location, action_taken, req.params.id]
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
    const userPrompt = `Bullying Report:\nReporter Type: ${item.reporter_type}\nVictim Grade: ${item.victim_grade}\nBully Grade: ${item.bully_grade}\nIncident Type: ${item.incident_type}\nDescription: ${item.description}\nLocation: ${item.location}\nAction Taken: ${item.action_taken}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { reporter_type, victim_grade, bully_grade, incident_type, description, location, action_taken } = req.body;
    const userPrompt = `Bullying Report:\nReporter Type: ${reporter_type || 'N/A'}\nVictim Grade: ${victim_grade || 'N/A'}\nBully Grade: ${bully_grade || 'N/A'}\nIncident Type: ${incident_type || 'N/A'}\nDescription: ${description || 'N/A'}\nLocation: ${location || 'N/A'}\nAction Taken: ${action_taken || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
