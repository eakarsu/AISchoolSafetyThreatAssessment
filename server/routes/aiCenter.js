const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

// POST /chat - General AI safety chat
router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const systemPrompt = `You are a school safety AI assistant with expertise in all aspects of K-12 school security, emergency preparedness, threat assessment, student well-being, and regulatory compliance. Provide helpful, accurate, and actionable advice. If a question involves an immediate safety threat, always recommend contacting law enforcement first. Be professional, thorough, and prioritize student and staff safety in all responses.`;

    const analysis = await askAI(systemPrompt, message);
    res.json({ response: analysis });
  } catch (error) { next(error); }
});

// POST /risk-predict - Predictive risk modeling
router.post('/risk-predict', async (req, res, next) => {
  try {
    const { timeframe, focus_areas } = req.body;

    // Gather current data summaries
    const [threats, incidents, behavioral, tips, weapons, community] = await Promise.all([
      pool.query(`SELECT threat_level, status, COUNT(*) as count FROM threat_assessments GROUP BY threat_level, status`),
      pool.query(`SELECT severity, status, COUNT(*) as count FROM incident_reports GROUP BY severity, status`),
      pool.query(`SELECT risk_level, behavior_type, COUNT(*) as count FROM behavioral_analyses GROUP BY risk_level, behavior_type`),
      pool.query(`SELECT priority, status, COUNT(*) as count FROM anonymous_tips GROUP BY priority, status`),
      pool.query(`SELECT threat_level, status, COUNT(*) as count FROM weapon_detections GROUP BY threat_level, status`),
      pool.query(`SELECT risk_level, risk_type, COUNT(*) as count FROM community_risks GROUP BY risk_level, risk_type`),
    ]);

    const systemPrompt = `You are a predictive analytics expert specializing in school safety risk modeling. Based on the provided data summaries, generate a comprehensive risk prediction report. Include:
1) Overall risk score (1-100) with justification
2) Top 5 predicted risk areas for the specified timeframe
3) Trend analysis based on current data patterns
4) Early warning indicators to monitor
5) Recommended preventive actions ranked by priority
6) Resource allocation recommendations
7) Confidence level in predictions
Use data-driven reasoning and established risk assessment frameworks.`;

    const userPrompt = `Timeframe: ${timeframe || 'Next 30 days'}
Focus Areas: ${focus_areas || 'All areas'}

Current Data Summary:
- Threat Assessments: ${JSON.stringify(threats.rows)}
- Incident Reports: ${JSON.stringify(incidents.rows)}
- Behavioral Analyses: ${JSON.stringify(behavioral.rows)}
- Anonymous Tips: ${JSON.stringify(tips.rows)}
- Weapon Detections: ${JSON.stringify(weapons.rows)}
- Community Risks: ${JSON.stringify(community.rows)}`;

    const analysis = await askAI(systemPrompt, userPrompt);
    res.json({ prediction: analysis });
  } catch (error) { next(error); }
});

// POST /generate-report - Generate comprehensive safety report
router.post('/generate-report', async (req, res, next) => {
  try {
    const { report_type, date_range } = req.body;

    const [threats, incidents, behavioral, drills, audits, tips, weapons, bullying, mentalHealth] = await Promise.all([
      pool.query('SELECT * FROM threat_assessments ORDER BY created_at DESC LIMIT 20'),
      pool.query('SELECT * FROM incident_reports ORDER BY created_at DESC LIMIT 20'),
      pool.query('SELECT * FROM behavioral_analyses ORDER BY created_at DESC LIMIT 20'),
      pool.query('SELECT * FROM drill_records ORDER BY date DESC LIMIT 10'),
      pool.query('SELECT * FROM safety_audits ORDER BY audit_date DESC LIMIT 10'),
      pool.query('SELECT * FROM anonymous_tips ORDER BY created_at DESC LIMIT 10'),
      pool.query('SELECT * FROM weapon_detections ORDER BY created_at DESC LIMIT 10'),
      pool.query('SELECT * FROM bullying_reports ORDER BY created_at DESC LIMIT 10'),
      pool.query('SELECT * FROM mental_health_screenings ORDER BY created_at DESC LIMIT 10'),
    ]);

    const systemPrompt = `You are a school safety report writer preparing a formal comprehensive safety report for school administration and the school board. Generate a professional report that includes:
1) Executive Summary
2) Key Metrics and Statistics
3) Threat Assessment Overview
4) Incident Analysis
5) Behavioral Concerns Summary
6) Drill Performance Review
7) Safety Audit Findings
8) Mental Health Screening Trends
9) Bullying Report Trends
10) Recommendations and Action Items
11) Resource Requirements
12) Conclusion
Format the report professionally with clear sections and actionable recommendations.`;

    const userPrompt = `Report Type: ${report_type || 'Comprehensive Safety Report'}
Date Range: ${date_range || 'Current Period'}

DATA:
Threats (${threats.rows.length}): ${JSON.stringify(threats.rows.map(r => ({ title: r.title, level: r.threat_level, status: r.status })))}
Incidents (${incidents.rows.length}): ${JSON.stringify(incidents.rows.map(r => ({ title: r.title, type: r.incident_type, severity: r.severity, status: r.status })))}
Behavioral (${behavioral.rows.length}): ${JSON.stringify(behavioral.rows.map(r => ({ type: r.behavior_type, risk: r.risk_level, grade: r.grade })))}
Drills (${drills.rows.length}): ${JSON.stringify(drills.rows.map(r => ({ type: r.drill_type, rating: r.rating, issues: r.issues_found })))}
Audits (${audits.rows.length}): ${JSON.stringify(audits.rows.map(r => ({ area: r.area, rating: r.risk_rating, findings: r.findings })))}
Tips (${tips.rows.length}): ${JSON.stringify(tips.rows.map(r => ({ category: r.tip_category, priority: r.priority, status: r.status })))}
Weapons (${weapons.rows.length}): ${JSON.stringify(weapons.rows.map(r => ({ type: r.detection_type, level: r.threat_level, status: r.status })))}
Bullying (${bullying.rows.length}): ${JSON.stringify(bullying.rows.map(r => ({ type: r.incident_type, victim_grade: r.victim_grade })))}
Mental Health (${mentalHealth.rows.length}): ${JSON.stringify(mentalHealth.rows.map(r => ({ type: r.screening_type, grade: r.grade })))}`;

    const analysis = await askAI(systemPrompt, userPrompt);
    res.json({ report: analysis });
  } catch (error) { next(error); }
});

// POST /pattern-recognition - Analyze patterns across all data
router.post('/pattern-recognition', async (req, res, next) => {
  try {
    const { focus, lookback_days } = req.body;

    const [threats, incidents, behavioral, tips, bullying, accessLogs] = await Promise.all([
      pool.query('SELECT title, description, location, threat_level, created_at FROM threat_assessments ORDER BY created_at DESC LIMIT 15'),
      pool.query('SELECT title, incident_type, location, severity, date FROM incident_reports ORDER BY date DESC LIMIT 15'),
      pool.query('SELECT behavior_type, grade, frequency, risk_level FROM behavioral_analyses ORDER BY created_at DESC LIMIT 15'),
      pool.query('SELECT tip_category, message, priority, location_hint FROM anonymous_tips ORDER BY created_at DESC LIMIT 15'),
      pool.query('SELECT incident_type, victim_grade, bully_grade, location FROM bullying_reports ORDER BY created_at DESC LIMIT 15'),
      pool.query('SELECT entry_point, person_type, access_method, flagged, timestamp FROM access_control_logs WHERE flagged = true ORDER BY created_at DESC LIMIT 15'),
    ]);

    const systemPrompt = `You are a data analyst specializing in school safety pattern recognition and trend analysis. Analyze the provided cross-domain safety data and identify:
1) Recurring patterns across different data types
2) Location-based hotspots (areas with multiple incidents)
3) Time-based patterns (time of day, day of week trends)
4) Grade-level risk patterns
5) Escalation patterns (situations getting worse)
6) Correlations between different types of safety events
7) Emerging threats or concerning trends
8) Positive trends or improvements
Provide specific, data-backed observations and actionable insights.`;

    const userPrompt = `Analysis Focus: ${focus || 'All patterns'}
Lookback Period: ${lookback_days || 30} days

Cross-Domain Safety Data:
THREATS: ${JSON.stringify(threats.rows)}
INCIDENTS: ${JSON.stringify(incidents.rows)}
BEHAVIORAL: ${JSON.stringify(behavioral.rows)}
ANONYMOUS TIPS: ${JSON.stringify(tips.rows)}
BULLYING: ${JSON.stringify(bullying.rows)}
FLAGGED ACCESS: ${JSON.stringify(accessLogs.rows)}`;

    const analysis = await askAI(systemPrompt, userPrompt);
    res.json({ patterns: analysis });
  } catch (error) { next(error); }
});

// POST /batch-analysis - Analyze multiple items at once
router.post('/batch-analysis', async (req, res, next) => {
  try {
    const { items, analysis_type } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const systemPrompt = `You are a school safety analysis expert. Perform a batch analysis of the following ${analysis_type || 'safety'} items. For each item, provide a brief assessment. Then provide an overall summary that identifies:
1) Common themes across all items
2) Priority ranking of items by risk level
3) Recommended actions for the highest priority items
4) Resource allocation suggestions
Be concise but thorough.`;

    const userPrompt = `Analysis Type: ${analysis_type || 'General Safety'}
Items to Analyze:
${items.map((item, i) => `\n--- Item ${i + 1} ---\n${typeof item === 'string' ? item : JSON.stringify(item)}`).join('\n')}`;

    const analysis = await askAI(systemPrompt, userPrompt);
    res.json({ analysis });
  } catch (error) { next(error); }
});

module.exports = router;
