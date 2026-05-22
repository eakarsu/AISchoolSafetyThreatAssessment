# Audit Note — AISchoolSafetyThreatAssessment

## Original audit recommendations (batch_07.md §25)

**Missing AI endpoints:** `/threat-risk-score`, `/behavioral-pattern-detection`, `/bullying-detection`, `/emergency-readiness-assessment`, `/first-responder-brief`, `/mental-health-referral`.

**Missing non-AI features:** anonymous reporting, SOS/panic alert, emergency comms, first-responder comms, visitor management, training tracking.

**Custom suggestions:** behavioral intelligence platform, threat severity scoring, mental-health early identification, emergency playbook automation, community risk monitoring, role-based training personalization.

Note: audit said "0 AI endpoints"; reality has `aiCenter` (chat, risk-predict), `threats/:id/analyze`, `behavioral/:id/analyze`, `bullying/:id/analyze`, plus AI flows in visitors, mentalHealth, training, drills, community, accessControl, weapons routes via `askAI`.

## Implemented this pass (3 mechanical)
1. `POST /api/ai-center/threat-risk-score` — NTAC-aligned severity score with triage actions, owner assignment.
2. `POST /api/ai-center/first-responder-brief` — sub-60-second incident brief for first responders (layout, hazards, staging, comms).
3. `POST /api/ai-center/mental-health-referral` — tiered support recommendation with referral types and urgency, no diagnosis.

All three reuse `askAI(json=true)`, persist to `ai_analyses`, follow the existing aiCenter pattern. Syntax-checked.

## Backlog (prioritized)
1. `POST /api/ai-center/emergency-readiness-assessment` (mechanical follow-up — audit drills/training/protocols).
2. Anonymous reporting endpoint with PII separation (mechanical).
3. SOS/panic alert dispatcher (NEEDS-PRODUCT-DECISION + push/notification creds).
4. Visitor management integration (NEEDS-CREDS for kiosk vendors).
5. Training compliance dashboard aggregator (mechanical).

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS.
- **FE state:** `client/src/pages/ThreatRiskScorePage.jsx`, `FirstResponderBriefPage.jsx`, `MentalHealthReferralPage.jsx` already exist and call the three pass-2 backend endpoints under `/api/ai-center/*`. Routes `/threat-risk-score`, `/first-responder-brief`, `/mental-health-referral` are registered in `App.jsx`.
- **Auth:** each page receives `token` prop (sourced from localStorage in App.jsx) and sends `Authorization: Bearer ${token}` headers.
- **503/no-key handling:** non-2xx response surfaces `data.error` to the user.
- **Files modified:** none.

## Apply pass 6 (close-out)

**Items implemented:**
1. `POST /api/ai-center/anonymous-report` — accepts `{category, description, school_id?, location_hint?, has_imminent_threat?}`. Server uses an allow-list (explicitly discards any user-identifying fields not in the contract), scrubs emails/phones/SSN from `description`, generates a UUID via `crypto.randomUUID()`, calls `askAI` for severity classification with graceful fallback when no API key, and persists sanitized fields ONLY (no `user_id`, no IP, no submitter identity). Tries `anonymous_tips` table first; falls back to `ai_analyses` with `user_id=NULL` if schema differs (both wrapped in `.catch(() => {})`). Returns `{report_id, category, severity_classification, escalation_triggered, next_steps_recommended}`. Imminent-threat flag always forces escalation.
2. `GET /api/ai-center/training-compliance?district_id=...&period=...` — aggregator only (no LLM call). Pulls from `training_programs`, `training_records`, `staff_certifications`, `staff`, `drills`, each wrapped in `.catch(() => ({rows:[]}))`. Computes `overall_compliance_pct` from `completion_rate` mean, builds `per_school` rollup, flags `expiring_certifications` (<60 days), `overdue_staff` (expired cert OR no training record), and synthesizes `recommended_actions` from the data shape.
3. `POST /api/ai-center/emergency-readiness-assessment` — ALREADY PRESENT in `routes/aiCenter.js` (lines 137–159) from an earlier pass; left as-is per append-only constraint. Existing body shape `{school_context, focus}` differs from the spec's `{school, scenario_focus}` but the endpoint exists, so no duplicate added.

**File:** `server/routes/aiCenter.js` (appended two handlers before `GET /analyses`; added `const crypto = require('crypto')` inline).

**Syntax:** `node --check server/routes/aiCenter.js` — **PASS**.

**Constraints honored:** append-only (no existing handlers modified), no new deps (used built-in `crypto`), no schema changes (all DB queries `.catch`-guarded), no `.env` edits, no FE changes, no server started.

**Remaining backlog:**
- NEEDS-CREDS: kiosk vendor integration for visitor management (e.g., Raptor/Verkada/HID API keys + webhook URLs).
- NEEDS-PRODUCT-DECISION: SOS/panic alert dispatcher — requires choice of push provider (FCM/APNs/Twilio Voice) + creds, plus product decision on dispatch routing (911 CAD vs internal SRO vs both) and chain-of-custody audit policy.
