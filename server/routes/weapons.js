const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'weapon_detections';
const SYSTEM_PROMPT = `You are a school security weapons detection and response expert. Analyze this weapon detection event and provide:
1) Threat severity assessment
2) Response protocol evaluation (was the response appropriate?)
3) Investigation recommendations
4) Policy and procedure improvements
5) Detection system effectiveness analysis
6) Legal and law enforcement coordination needs
7) Communication strategy for the school community
Prioritize immediate safety while ensuring due process and proportional response.`;

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
    const { detection_type, location, description, threat_level, response_action, detected_by, status } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (detection_type, location, description, threat_level, response_action, detected_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [detection_type, location, description, threat_level, response_action, detected_by, status || 'open']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { detection_type, location, description, threat_level, response_action, detected_by, status } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET detection_type=$1, location=$2, description=$3, threat_level=$4, response_action=$5, detected_by=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [detection_type, location, description, threat_level, response_action, detected_by, status, req.params.id]
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
    const userPrompt = `Weapon Detection Event:\nDetection Type: ${item.detection_type}\nLocation: ${item.location}\nDescription: ${item.description}\nThreat Level: ${item.threat_level}\nResponse Action: ${item.response_action}\nDetected By: ${item.detected_by}\nStatus: ${item.status}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { detection_type, location, description, threat_level, response_action, detected_by } = req.body;
    const userPrompt = `Weapon Detection Event:\nDetection Type: ${detection_type || 'N/A'}\nLocation: ${location || 'N/A'}\nDescription: ${description || 'N/A'}\nThreat Level: ${threat_level || 'N/A'}\nResponse Action: ${response_action || 'N/A'}\nDetected By: ${detected_by || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
