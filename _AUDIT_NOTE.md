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
