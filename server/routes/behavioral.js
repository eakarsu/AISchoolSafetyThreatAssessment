const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'behavioral_analyses';
const SYSTEM_PROMPT = `You are a school behavioral psychologist specializing in K-12 student behavior. Analyze this student's behavior and provide:
1) Behavioral risk assessment (low/moderate/high/critical)
2) Potential underlying causes and contributing factors
3) Recommended evidence-based interventions
4) Warning signs to watch for (escalation indicators)
5) Support strategies for teachers and staff
6) Family engagement recommendations
Maintain confidentiality standards and focus on the student's well-being.`;

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
    const { student_name, grade, behavior_type, description, frequency, risk_level, counselor_notes } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (student_name, grade, behavior_type, description, frequency, risk_level, counselor_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [student_name, grade, behavior_type, description, frequency, risk_level, counselor_notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { student_name, grade, behavior_type, description, frequency, risk_level, counselor_notes } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET student_name=$1, grade=$2, behavior_type=$3, description=$4, frequency=$5, risk_level=$6, counselor_notes=$7
       WHERE id=$8 RETURNING *`,
      [student_name, grade, behavior_type, description, frequency, risk_level, counselor_notes, req.params.id]
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
    const userPrompt = `Student Behavioral Analysis:\nStudent: ${item.student_name}\nGrade: ${item.grade}\nBehavior Type: ${item.behavior_type}\nDescription: ${item.description}\nFrequency: ${item.frequency}\nCurrent Risk Level: ${item.risk_level}\nCounselor Notes: ${item.counselor_notes}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { student_name, grade, behavior_type, description, frequency, risk_level, counselor_notes } = req.body;
    const userPrompt = `Student Behavioral Analysis:\nStudent: ${student_name || 'N/A'}\nGrade: ${grade || 'N/A'}\nBehavior Type: ${behavior_type || 'N/A'}\nDescription: ${description || 'N/A'}\nFrequency: ${frequency || 'N/A'}\nRisk Level: ${risk_level || 'N/A'}\nCounselor Notes: ${counselor_notes || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
