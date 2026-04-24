const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

const TABLE = 'mental_health_screenings';
const SYSTEM_PROMPT = `You are a school mental health professional and licensed clinical psychologist. Analyze this mental health screening and provide:
1) Risk level assessment with clinical justification
2) Differential considerations based on presented indicators
3) Evidence-based intervention recommendations
4) Safety planning needs (if applicable)
5) Referral recommendations (in-school and external)
6) Follow-up timeline and monitoring plan
7) Family engagement strategies
Maintain HIPAA/FERPA compliance awareness and prioritize student safety. Flag any immediate safety concerns.`;

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
    const { student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor } = req.body;
    const result = await pool.query(
      `INSERT INTO ${TABLE} (student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor } = req.body;
    const result = await pool.query(
      `UPDATE ${TABLE} SET student_name=$1, grade=$2, screening_type=$3, risk_indicators=$4, recommendations=$5, follow_up_date=$6, counselor=$7
       WHERE id=$8 RETURNING *`,
      [student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor, req.params.id]
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
    const userPrompt = `Mental Health Screening:\nStudent: ${item.student_name}\nGrade: ${item.grade}\nScreening Type: ${item.screening_type}\nRisk Indicators: ${item.risk_indicators}\nRecommendations: ${item.recommendations}\nFollow-up Date: ${item.follow_up_date}\nCounselor: ${item.counselor}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1 WHERE id = $2`, [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) { next(error); }
});

router.post('/ai-analyze', async (req, res, next) => {
  try {
    const { student_name, grade, screening_type, risk_indicators, recommendations, counselor } = req.body;
    const userPrompt = `Mental Health Screening:\nStudent: ${student_name || 'N/A'}\nGrade: ${grade || 'N/A'}\nScreening Type: ${screening_type || 'N/A'}\nRisk Indicators: ${risk_indicators || 'N/A'}\nRecommendations: ${recommendations || 'N/A'}\nCounselor: ${counselor || 'N/A'}`;
    const analysis = await askAI(SYSTEM_PROMPT, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
