const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'emergency_plans';
const SYSTEM_PROMPT = `You are an emergency preparedness expert for K-12 schools. Analyze this emergency plan and provide:
1) Plan completeness assessment (identify any gaps)
2) Alignment with FEMA and Department of Education best practices
3) Specific improvement recommendations
4) Staff training needs identified
5) Communication protocol adequacy
6) Special considerations for students with disabilities
Be specific and actionable in your recommendations.`;

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
    const { title, emergency_type, description, procedures, responsible_staff, last_updated } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (title, emergency_type, description, procedures, responsible_staff, last_updated)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, emergency_type, description, procedures, responsible_staff, last_updated || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { title, emergency_type, description, procedures, responsible_staff, last_updated } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET title=$1, emergency_type=$2, description=$3, procedures=$4, responsible_staff=$5, last_updated=$6
       WHERE id=$7 RETURNING *`,
      [title, emergency_type, description, procedures, responsible_staff, last_updated, req.params.id]
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
    const userPrompt = `Emergency Plan:\nTitle: ${item.title}\nType: ${item.emergency_type}\nDescription: ${item.description}\nProcedures: ${item.procedures}\nResponsible Staff: ${item.responsible_staff}\nLast Updated: ${item.last_updated}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { title, emergency_type, description, procedures, responsible_staff } = req.body;
    const userPrompt = `Emergency Plan:\nTitle: ${title || 'N/A'}\nType: ${emergency_type || 'N/A'}\nDescription: ${description || 'N/A'}\nProcedures: ${procedures || 'N/A'}\nResponsible Staff: ${responsible_staff || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
