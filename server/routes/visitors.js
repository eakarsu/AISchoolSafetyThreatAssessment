const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'visitor_logs';
const SYSTEM_PROMPT = `You are a school security visitor management expert. Analyze this visitor log entry and provide:
1) Risk assessment based on visitor information
2) Security protocol compliance evaluation
3) Red flags or concerns identified
4) Recommended follow-up actions
5) Suggestions for improving visitor screening
Focus on maintaining a welcoming yet secure school environment.`;

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
    const { visitor_name, purpose, host_staff, check_in, check_out, id_verified, risk_score } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (visitor_name, purpose, host_staff, check_in, check_out, id_verified, risk_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [visitor_name, purpose, host_staff, check_in, check_out, id_verified, risk_score || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { visitor_name, purpose, host_staff, check_in, check_out, id_verified, risk_score } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET visitor_name=$1, purpose=$2, host_staff=$3, check_in=$4, check_out=$5, id_verified=$6, risk_score=$7
       WHERE id=$8 RETURNING *`,
      [visitor_name, purpose, host_staff, check_in, check_out, id_verified, risk_score, req.params.id]
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
    const userPrompt = `Visitor Log Entry:\nVisitor: ${item.visitor_name}\nPurpose: ${item.purpose}\nHost Staff: ${item.host_staff}\nCheck-in: ${item.check_in}\nCheck-out: ${item.check_out}\nID Verified: ${item.id_verified}\nRisk Score: ${item.risk_score}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { visitor_name, purpose, host_staff, check_in, check_out, id_verified, risk_score } = req.body;
    const userPrompt = `Visitor Log Entry:\nVisitor: ${visitor_name || 'N/A'}\nPurpose: ${purpose || 'N/A'}\nHost Staff: ${host_staff || 'N/A'}\nCheck-in: ${check_in || 'N/A'}\nCheck-out: ${check_out || 'N/A'}\nID Verified: ${id_verified}\nRisk Score: ${risk_score || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
