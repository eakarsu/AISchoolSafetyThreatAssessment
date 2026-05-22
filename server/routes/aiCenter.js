const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../openrouter');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

router.use(auth);

// POST /chat - General AI safety chat
router.post('/chat', aiRateLimiter, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const systemPrompt = `You are a school safety AI assistant with expertise in K-12 school security, emergency preparedness, threat assessment, student well-being, and regulatory compliance. Provide helpful, accurate, and actionable advice. If a question involves an immediate safety threat, always recommend contacting law enforcement first.`;

    const response = await askAI(systemPrompt, message);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'ai-center/chat', null, JSON.stringify({ message, response })]).catch(() => {});
    res.json({ response });
  } catch (error) { next(error); }
});

// POST /risk-predict - Predictive risk modeling
router.post('/risk-predict', aiRateLimiter, async (req, res, next) => {
  try {
    const { timeframe, focus_areas } = req.body;

    const [threats, incidents, behavioral, tips, weapons, community] = await Promise.all([
      pool.query(`SELECT threat_level, status, COUNT(*) as count FROM threat_assessments GROUP BY threat_level, status`),
      pool.query(`SELECT severity, status, COUNT(*) as count FROM incident_reports GROUP BY severity, status`),
      pool.query(`SELECT risk_level, behavior_type, COUNT(*) as count FROM behavioral_analyses GROUP BY risk_level, behavior_type`),
      pool.query(`SELECT priority, status, COUNT(*) as count FROM anonymous_tips GROUP BY priority, status`),
      pool.query(`SELECT status, COUNT(*) as count FROM weapon_detections GROUP BY status`),
      pool.query(`SELECT risk_level, risk_type, COUNT(*) as count FROM community_risks GROUP BY risk_level, risk_type`),
    ]);

    const systemPrompt = `You are a predictive analytics expert specializing in school safety. Respond ONLY with valid JSON:
{
  "overall_risk_score": <integer 1-100>,
  "confidence_level": "low|medium|high",
  "top_risk_areas": [{"area": "text", "score": <int>, "trend": "increasing|stable|decreasing"}],
  "early_warning_indicators": ["indicator1", "indicator2"],
  "recommended_actions": [{"action": "text", "priority": "immediate|short_term|long_term"}],
  "resource_allocation": "allocation recommendations"
}`;

    const userPrompt = `Timeframe: ${timeframe || 'Next 30 days'}, Focus: ${focus_areas || 'All areas'}
Data: Threats: ${JSON.stringify(threats.rows)}, Incidents: ${JSON.stringify(incidents.rows)}, Behavioral: ${JSON.stringify(behavioral.rows)}, Tips: ${JSON.stringify(tips.rows)}, Weapons: ${JSON.stringify(weapons.rows)}, Community: ${JSON.stringify(community.rows)}`;

    const parsed = await askAI(systemPrompt, userPrompt, true);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'ai-center/risk-predict', null, JSON.stringify(parsed)]).catch(() => {});

    res.json({ prediction: parsed, model: (process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5') });
  } catch (error) { next(error); }
});

// POST /threat-risk-score - rate severity of a threat report
router.post('/threat-risk-score', aiRateLimiter, async (req, res, next) => {
  try {
    const { threat_id, threat_text, source, context } = req.body || {};
    let threatRecord = null;
    if (threat_id) {
      const r = await pool.query('SELECT * FROM threat_assessments WHERE id = $1', [threat_id]).catch(() => ({ rows: [] }));
      threatRecord = r.rows[0] || null;
    }
    const systemPrompt = `You are a school threat-assessment AI aligned with NTAC and Secret Service / FBI guidance. Score severity and recommend immediate triage. Respond ONLY with valid JSON.`;
    const userPrompt = `Threat record: ${JSON.stringify(threatRecord)}
Threat text: ${threat_text || ''}
Source: ${source || ''}
Context: ${JSON.stringify(context || {})}

Return JSON: { severity_score:0-100, severity_band:"low|moderate|high|imminent", credibility_factors:[{factor,evidence,weight}], targeted_individuals:[], recommended_actions:[{action,owner:"law_enforcement|sro|admin|counselor",urgency:"immediate|24h|routine"}], legal_obligations:[], parent_notification_needed:bool, summary }.`;
    const parsed = await askAI(systemPrompt, userPrompt, true);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'ai-center/threat-risk-score', threat_id || null, JSON.stringify(parsed)]).catch(() => {});
    res.json({ score: parsed });
  } catch (error) { next(error); }
});

// POST /first-responder-brief - auto-generate emergency info packet
router.post('/first-responder-brief', aiRateLimiter, async (req, res, next) => {
  try {
    const { incident_id, incident_type, location, school_metadata } = req.body || {};
    let incident = null;
    if (incident_id) {
      const r = await pool.query('SELECT * FROM incident_reports WHERE id = $1', [incident_id]).catch(() => ({ rows: [] }));
      incident = r.rows[0] || null;
    }
    const systemPrompt = `You are a school emergency-operations AI. Produce a one-page brief that first responders can read in <60 seconds. Respond ONLY with valid JSON.`;
    const userPrompt = `Incident: ${JSON.stringify(incident)}
Type: ${incident_type || ''}
Location: ${JSON.stringify(location || {})}
School metadata: ${JSON.stringify(school_metadata || {})}

Return JSON: { incident_synopsis, current_threat_state:"active|contained|resolving", site_layout_keypoints:[{label,location,note}], staging_recommendation, ingress_egress_routes:[], building_access_codes_or_lockboxes:[], known_hazards:[], student_count_and_grades:"", staff_in_charge:[{name,role,contact}], comms_channels:[{frequency_or_app,purpose}], priority_actions_for_responders:[{action,owner_team,sequence}], summary }.`;
    const parsed = await askAI(systemPrompt, userPrompt, true);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'ai-center/first-responder-brief', incident_id || null, JSON.stringify(parsed)]).catch(() => {});
    res.json({ brief: parsed });
  } catch (error) { next(error); }
});

// POST /mental-health-referral - identify students needing support
router.post('/mental-health-referral', aiRateLimiter, async (req, res, next) => {
  try {
    const { student_id, observations, academic_signals, anonymous } = req.body || {};
    const systemPrompt = `You are a school-based mental-health triage AI. Do NOT diagnose. Recommend tiered support and referrals based on warning signs. Respond ONLY with valid JSON.`;
    const userPrompt = `Student: ${anonymous ? '[anonymized]' : (student_id || 'unspecified')}
Observations: ${JSON.stringify(observations || [])}
Academic signals: ${JSON.stringify(academic_signals || {})}

Return JSON: { tier:"universal|targeted|intensive", warning_signs_detected:[], suicide_or_self_harm_flag:bool, recommended_referrals:[{type:"school_counselor|community_mh|crisis_line|outside_provider|family_meeting",urgency:"immediate|this_week|routine",rationale}], parent_engagement_recommended:bool, parent_engagement_script:"", educator_supports:[], confidentiality_notes:"", summary }.`;
    const parsed = await askAI(systemPrompt, userPrompt, true);
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'ai-center/mental-health-referral', anonymous ? null : (student_id || null), JSON.stringify(parsed)]).catch(() => {});
    res.json({ referral: parsed });
  } catch (error) { next(error); }
});

// helper: send 503 if AI key missing
function ensureAI(parsed, res) {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    return false;
  }
  if (parsed === null || parsed === undefined) {
    res.status(503).json({ error: 'AI service unavailable: empty response from upstream' });
    return false;
  }
  return true;
}

// POST /emergency-readiness-assessment - audit drills/training/protocols
router.post('/emergency-readiness-assessment', aiRateLimiter, async (req, res, next) => {
  try {
    const { school_context, focus } = req.body || {};
    const [drills, training, plans] = await Promise.all([
      pool.query(`SELECT drill_type, status, scheduled_date, completed_date FROM drills ORDER BY scheduled_date DESC LIMIT 50`).catch(() => ({ rows: [] })),
      pool.query(`SELECT program_name, completion_rate, status FROM training_programs LIMIT 50`).catch(() => ({ rows: [] })),
      pool.query(`SELECT plan_type, status, last_reviewed FROM emergency_plans LIMIT 50`).catch(() => ({ rows: [] })),
    ]);
    const systemPrompt = `You are a school emergency-readiness AI. Audit drill cadence, training compliance, and emergency-plan freshness against best practice (NIMS, Standard Response Protocol). Respond ONLY with valid JSON.`;
    const userPrompt = `Context: ${school_context || 'K-12 campus, single-building'}
Focus: ${focus || 'overall readiness'}
Drills: ${JSON.stringify(drills.rows)}
Training programs: ${JSON.stringify(training.rows)}
Emergency plans: ${JSON.stringify(plans.rows)}

Return JSON: { readiness_score:0-100, gaps:[{area,severity,evidence,recommendation}], drills_due:[{type,reason,by_date}], training_compliance:{overall_pct,laggards:[]}, plan_review_status:[{plan_type,age_days,recommended_action}], top_priorities:[{action,owner,deadline}], summary }.`;
    const parsed = await askAI(systemPrompt, userPrompt, true);
    if (!ensureAI(parsed, res)) return;
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'ai-center/emergency-readiness-assessment', null, JSON.stringify(parsed)]).catch(() => {});
    res.json({ assessment: parsed });
  } catch (error) { next(error); }
});

// POST /anonymous-tip-triage - PII-separated triage of anonymous tip text
router.post('/anonymous-tip-triage', aiRateLimiter, async (req, res, next) => {
  try {
    const { tip_text, channel } = req.body || {};
    if (!tip_text) return res.status(400).json({ error: 'tip_text is required' });
    // Light PII separation: extract obvious names/emails/phones to a separate field, do NOT send raw PII to model.
    const piiPatterns = {
      emails: /[\w.+-]+@[\w-]+\.[\w.-]+/g,
      phones: /\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g,
    };
    const extracted = { emails: [], phones: [] };
    let scrubbed = tip_text;
    for (const [k, re] of Object.entries(piiPatterns)) {
      const matches = tip_text.match(re) || [];
      extracted[k] = matches;
      scrubbed = scrubbed.replace(re, `[${k.slice(0, -1).toUpperCase()}_REDACTED]`);
    }
    const systemPrompt = `You are an anonymous-tip triage AI for a school. PII has been redacted. Classify priority, route to owner, and recommend next steps. Respond ONLY with valid JSON.`;
    const userPrompt = `Channel: ${channel || 'unknown'}
Scrubbed tip text: ${scrubbed}

Return JSON: { priority:"low|medium|high|imminent", category:"bullying|threat|substance|self_harm|abuse|safety|other", credibility:"low|medium|high", recommended_owner:"sro|admin|counselor|external_agency", recommended_actions:[{action,urgency:"immediate|24h|routine"}], follow_up_questions:[], anonymization_notes:"", summary }.`;
    const parsed = await askAI(systemPrompt, userPrompt, true);
    if (!ensureAI(parsed, res)) return;
    // store WITHOUT raw PII
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'ai-center/anonymous-tip-triage', null, JSON.stringify({ triage: parsed, scrubbed_tip: scrubbed })]).catch(() => {});
    // Return PII tokens to caller (logged-in admin only); never store them.
    res.json({ triage: parsed, scrubbed_tip: scrubbed, extracted_pii_tokens: extracted });
  } catch (error) { next(error); }
});

// POST /training-compliance-aggregate - aggregate training compliance + gaps
router.post('/training-compliance-aggregate', aiRateLimiter, async (req, res, next) => {
  try {
    const { role_focus } = req.body || {};
    const [programs, drills] = await Promise.all([
      pool.query(`SELECT program_name, completion_rate, status, last_updated FROM training_programs LIMIT 100`).catch(() => ({ rows: [] })),
      pool.query(`SELECT drill_type, status FROM drills ORDER BY scheduled_date DESC LIMIT 50`).catch(() => ({ rows: [] })),
    ]);
    const systemPrompt = `You are a training-compliance AI for K-12 staff. Aggregate completion data and identify role-based gaps. Respond ONLY with valid JSON.`;
    const userPrompt = `Role focus: ${role_focus || 'all staff'}
Programs: ${JSON.stringify(programs.rows)}
Recent drills: ${JSON.stringify(drills.rows)}

Return JSON: { overall_compliance_pct:0-100, by_role:[{role,compliance_pct,gaps:[]}], at_risk_programs:[{program,reason,recommendation}], next_30_day_actions:[{action,owner,deadline}], summary }.`;
    const parsed = await askAI(systemPrompt, userPrompt, true);
    if (!ensureAI(parsed, res)) return;
    await pool.query(`INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'ai-center/training-compliance-aggregate', null, JSON.stringify(parsed)]).catch(() => {});
    res.json({ compliance: parsed });
  } catch (error) { next(error); }
});

// POST /anonymous-report - file an anonymous safety report, server strips PII, never stores submitter identity
const crypto = require('crypto');
router.post('/anonymous-report', aiRateLimiter, async (req, res, next) => {
  try {
    const body = req.body || {};
    // Allow-list of sanitized fields ONLY — explicitly discard any user-identifying fields
    // (name, email, phone, user_id, submitter, ip, device_id, etc. are NEVER read).
    const allowedCategories = ['bullying', 'threat', 'safety_concern', 'other'];
    const category = allowedCategories.includes(body.category) ? body.category : 'other';
    const description = typeof body.description === 'string' ? body.description.slice(0, 5000) : '';
    const school_id = (typeof body.school_id === 'string' || typeof body.school_id === 'number') ? body.school_id : null;
    const location_hint = typeof body.location_hint === 'string' ? body.location_hint.slice(0, 500) : null;
    const has_imminent_threat = body.has_imminent_threat === true;

    if (!description) return res.status(400).json({ error: 'description is required' });

    // Light PII scrubbing on the description before any persistence/LLM call
    const piiPatterns = {
      emails: /[\w.+-]+@[\w-]+\.[\w.-]+/g,
      phones: /\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    };
    let scrubbed = description;
    for (const [k, re] of Object.entries(piiPatterns)) {
      scrubbed = scrubbed.replace(re, `[${k.toUpperCase()}_REDACTED]`);
    }

    const report_id = crypto.randomUUID();

    // Classify severity (LLM optional — degrade gracefully if no key)
    const systemPrompt = `You are an anonymous K-12 safety-report triage AI. PII has been pre-redacted. Classify severity and decide whether immediate escalation to law enforcement / SRO is warranted. Respond ONLY with valid JSON.`;
    const userPrompt = `Category: ${category}
Imminent-threat flag from submitter: ${has_imminent_threat}
Location hint: ${location_hint || 'unspecified'}
Scrubbed description: ${scrubbed}

Return JSON: { severity_classification:"low|moderate|high|imminent", escalation_triggered:bool, next_steps_recommended:[{step,owner:"sro|admin|counselor|law_enforcement",urgency:"immediate|24h|routine"}], rationale }.`;
    const parsed = await askAI(systemPrompt, userPrompt, true);

    // Fallback classification when AI unavailable — never block an anonymous report
    let severity_classification = 'moderate';
    let escalation_triggered = !!has_imminent_threat;
    let next_steps_recommended = [
      { step: 'Acknowledge receipt in tip-management dashboard', owner: 'admin', urgency: '24h' },
      { step: 'Route to appropriate role for follow-up', owner: 'admin', urgency: '24h' },
    ];
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.severity_classification === 'string') severity_classification = parsed.severity_classification;
      if (typeof parsed.escalation_triggered === 'boolean') escalation_triggered = parsed.escalation_triggered || escalation_triggered;
      if (Array.isArray(parsed.next_steps_recommended) && parsed.next_steps_recommended.length) {
        next_steps_recommended = parsed.next_steps_recommended;
      }
    }
    if (has_imminent_threat) {
      severity_classification = severity_classification === 'low' ? 'high' : (severity_classification || 'high');
      escalation_triggered = true;
    }

    // Persist sanitized fields only — NEVER store submitter identity, IP, or auth user_id.
    // Try anonymous_tips first; if schema differs, fall back to ai_analyses.
    const persistPayload = {
      report_id,
      category,
      description: scrubbed,
      school_id,
      location_hint,
      has_imminent_threat,
      severity_classification,
      escalation_triggered,
    };
    await pool.query(
      `INSERT INTO anonymous_tips (tip_text, category, priority, status, submitter_hash) VALUES ($1,$2,$3,$4,$5)`,
      [scrubbed, category, severity_classification, escalation_triggered ? 'escalated' : 'new', report_id]
    ).catch(async () => {
      await pool.query(
        `INSERT INTO ai_analyses (user_id, endpoint, entity_id, result) VALUES ($1,$2,$3,$4)`,
        [null, 'ai-center/anonymous-report', null, JSON.stringify(persistPayload)]
      ).catch(() => {});
    });

    res.json({
      report_id,
      category,
      severity_classification,
      escalation_triggered,
      next_steps_recommended,
    });
  } catch (error) { next(error); }
});

// GET /training-compliance - aggregator dashboard for training records, certifications, overdue staff
router.get('/training-compliance', async (req, res, next) => {
  try {
    const { district_id, period } = req.query || {};

    // Aggregate from existing tables with graceful fallback if any are absent
    const [programs, trainingRecords, certifications, staff, drills] = await Promise.all([
      pool.query(`SELECT id, program_name, training_type, participants, completion_rate, status FROM training_programs`).catch(() => ({ rows: [] })),
      pool.query(`SELECT * FROM training_records`).catch(() => ({ rows: [] })),
      pool.query(`SELECT * FROM staff_certifications`).catch(() => ({ rows: [] })),
      pool.query(`SELECT id, name, role, school_id FROM staff`).catch(() => ({ rows: [] })),
      pool.query(`SELECT drill_type, status FROM drills`).catch(() => ({ rows: [] })),
    ]);

    // Compute overall compliance from training_programs.completion_rate (0-100)
    const progs = programs.rows || [];
    const rates = progs.map(p => Number(p.completion_rate)).filter(n => !isNaN(n));
    const overall_compliance_pct = rates.length
      ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
      : 0;

    // Per-school aggregation (best-effort — schools may live in staff rows or not at all)
    const schoolMap = new Map();
    for (const s of (staff.rows || [])) {
      const sid = s.school_id || 'unassigned';
      if (!schoolMap.has(sid)) schoolMap.set(sid, { school_id: sid, staff_count: 0, overdue_count: 0 });
      schoolMap.get(sid).staff_count += 1;
    }
    const now = Date.now();
    const isExpired = (d) => {
      if (!d) return false;
      const t = new Date(d).getTime();
      return !isNaN(t) && t < now;
    };
    const isExpiringSoon = (d, days = 60) => {
      if (!d) return false;
      const t = new Date(d).getTime();
      if (isNaN(t)) return false;
      const horizon = now + days * 24 * 60 * 60 * 1000;
      return t >= now && t <= horizon;
    };

    const certRows = certifications.rows || [];
    const expiring_certifications = certRows.filter(c => isExpiringSoon(c.expires_at || c.expiration_date || c.expires));
    const expired_certifications = certRows.filter(c => isExpired(c.expires_at || c.expiration_date || c.expires));

    // Overdue staff = staff with at least one expired cert OR no recorded training
    const recordRows = trainingRecords.rows || [];
    const staffWithRecord = new Set(recordRows.map(r => r.staff_id || r.user_id).filter(Boolean));
    const overdue_staff = (staff.rows || []).filter(s => {
      const hasNoRecord = staffWithRecord.size > 0 && !staffWithRecord.has(s.id);
      const hasExpiredCert = expired_certifications.some(c => (c.staff_id || c.user_id) === s.id);
      return hasExpiredCert || hasNoRecord;
    }).map(s => ({ staff_id: s.id, name: s.name, role: s.role, school_id: s.school_id }));

    // Bump per-school overdue counts
    for (const o of overdue_staff) {
      const sid = o.school_id || 'unassigned';
      if (!schoolMap.has(sid)) schoolMap.set(sid, { school_id: sid, staff_count: 0, overdue_count: 0 });
      schoolMap.get(sid).overdue_count += 1;
    }

    const per_school = Array.from(schoolMap.values()).map(s => ({
      ...s,
      compliance_pct: s.staff_count > 0
        ? Math.max(0, Math.round(((s.staff_count - s.overdue_count) / s.staff_count) * 100))
        : overall_compliance_pct,
    }));

    const recommended_actions = [];
    if (expired_certifications.length > 0) {
      recommended_actions.push({ action: `Renew ${expired_certifications.length} expired certification(s)`, urgency: 'immediate' });
    }
    if (expiring_certifications.length > 0) {
      recommended_actions.push({ action: `Schedule renewal for ${expiring_certifications.length} cert(s) expiring in <60 days`, urgency: 'short_term' });
    }
    if (overdue_staff.length > 0) {
      recommended_actions.push({ action: `Assign mandatory training to ${overdue_staff.length} overdue staff`, urgency: 'short_term' });
    }
    const atRiskPrograms = progs.filter(p => Number(p.completion_rate) < 80);
    if (atRiskPrograms.length > 0) {
      recommended_actions.push({ action: `Boost completion for ${atRiskPrograms.length} program(s) below 80%`, urgency: 'short_term' });
    }
    if (recommended_actions.length === 0) {
      recommended_actions.push({ action: 'Compliance healthy — continue monthly audit cadence', urgency: 'routine' });
    }

    res.json({
      district_id: district_id || null,
      period: period || 'current',
      overall_compliance_pct,
      per_school,
      expiring_certifications,
      overdue_staff,
      recommended_actions,
      meta: {
        programs_count: progs.length,
        training_records_count: recordRows.length,
        certifications_count: certRows.length,
        staff_count: (staff.rows || []).length,
        drills_count: (drills.rows || []).length,
      },
    });
  } catch (error) { next(error); }
});

// GET /summary - Get AI analyses history
router.get('/analyses', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const [dataRes, countRes] = await Promise.all([
      pool.query(`SELECT * FROM ai_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]),
      pool.query(`SELECT COUNT(*) FROM ai_analyses WHERE user_id = $1`, [req.user.id]),
    ]);
    const total = parseInt(countRes.rows[0].count);
    res.json({ data: dataRes.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

module.exports = router;
