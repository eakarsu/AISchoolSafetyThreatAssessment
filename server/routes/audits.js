const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'safety_audits';
const SYSTEM_PROMPT = `You are a school safety audit specialist. Analyze this safety audit and provide:
1) Risk prioritization of findings (critical/high/medium/low)
2) Compliance assessment against safety codes and regulations
3) Cost-effective remediation recommendations
4) Timeline for corrective actions (immediate/short-term/long-term)
5) Impact on student and staff safety
6) Follow-up audit recommendations
Be specific about regulatory standards and prioritize based on risk to life safety.`;

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
    const { area, audit_type, findings, risk_rating, recommendations, auditor, audit_date } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (area, audit_type, findings, risk_rating, recommendations, auditor, audit_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [area, audit_type, findings, risk_rating, recommendations, auditor, audit_date || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { area, audit_type, findings, risk_rating, recommendations, auditor, audit_date } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET area=$1, audit_type=$2, findings=$3, risk_rating=$4, recommendations=$5, auditor=$6, audit_date=$7
       WHERE id=$8 RETURNING *`,
      [area, audit_type, findings, risk_rating, recommendations, auditor, audit_date, req.params.id]
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
    const userPrompt = `Safety Audit Report:\nArea: ${item.area}\nAudit Type: ${item.audit_type}\nFindings: ${item.findings}\nRisk Rating: ${item.risk_rating}\nRecommendations: ${item.recommendations}\nAuditor: ${item.auditor}\nAudit Date: ${item.audit_date}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { area, audit_type, findings, risk_rating, recommendations, auditor } = req.body;
    const userPrompt = `Safety Audit Report:\nArea: ${area || 'N/A'}\nAudit Type: ${audit_type || 'N/A'}\nFindings: ${findings || 'N/A'}\nRisk Rating: ${risk_rating || 'N/A'}\nRecommendations: ${recommendations || 'N/A'}\nAuditor: ${auditor || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
