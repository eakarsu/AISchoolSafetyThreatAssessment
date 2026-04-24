const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'community_risks';
const SYSTEM_PROMPT = `You are a community safety and risk assessment expert for school districts. Analyze this community risk and provide:
1) Risk severity and proximity assessment
2) Potential impact on school safety and operations
3) Recommended mitigation strategies
4) Community partnership and resource recommendations
5) Communication plan for parents and staff
6) Monitoring and reassessment schedule
7) Coordination with law enforcement and community agencies
Consider both immediate and long-term implications for the school community.`;

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
    const { risk_type, area, description, risk_level, mitigation, reported_by, last_assessed } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (risk_type, area, description, risk_level, mitigation, reported_by, last_assessed)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [risk_type, area, description, risk_level, mitigation, reported_by, last_assessed || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { risk_type, area, description, risk_level, mitigation, reported_by, last_assessed } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET risk_type=$1, area=$2, description=$3, risk_level=$4, mitigation=$5, reported_by=$6, last_assessed=$7
       WHERE id=$8 RETURNING *`,
      [risk_type, area, description, risk_level, mitigation, reported_by, last_assessed, req.params.id]
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
    const userPrompt = `Community Risk Assessment:\nRisk Type: ${item.risk_type}\nArea: ${item.area}\nDescription: ${item.description}\nRisk Level: ${item.risk_level}\nMitigation: ${item.mitigation}\nReported By: ${item.reported_by}\nLast Assessed: ${item.last_assessed}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { risk_type, area, description, risk_level, mitigation, reported_by } = req.body;
    const userPrompt = `Community Risk Assessment:\nRisk Type: ${risk_type || 'N/A'}\nArea: ${area || 'N/A'}\nDescription: ${description || 'N/A'}\nRisk Level: ${risk_level || 'N/A'}\nMitigation: ${mitigation || 'N/A'}\nReported By: ${reported_by || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
