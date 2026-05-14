const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || `http://localhost:${process.env.CLIENT_PORT || 3000}`,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Public routes (no auth required)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tips/form', require('./routes/tipsPublic'));
app.use('/api/tips/submit', require('./routes/tipsPublic'));

// Protected routes
app.use('/api/threats', require('./routes/threats'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/behavioral', require('./routes/behavioral'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/audits', require('./routes/audits'));
app.use('/api/training', require('./routes/training'));
app.use('/api/bullying', require('./routes/bullying'));
app.use('/api/mental-health', require('./routes/mentalHealth'));
app.use('/api/tips', require('./routes/tips'));
app.use('/api/drills', require('./routes/drills'));
app.use('/api/access-control', require('./routes/accessControl'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/weapons', require('./routes/weapons'));
app.use('/api/community', require('./routes/community'));
app.use('/api/ai-center', require('./routes/aiCenter'));
app.use('/api/audit-log', require('./routes/auditLog'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`School Safety Server running on port ${PORT}`);
});

module.exports = app;

// AI feature mount: threat-severity
app.use('/api/ai/threat-severity', require('./routes/ai-threat-severity'));
// === Batch 07 Gaps & Frontend Mounts ===
app.use('/api/gap-no-threatriskscore-severity-ai', require('./routes/gap-no-threatriskscore-severity-ai'));
app.use('/api/gap-no-behavioralpatterndetection', require('./routes/gap-no-behavioralpatterndetection'));
app.use('/api/gap-no-bullyingdetection-from-textcommunication', require('./routes/gap-no-bullyingdetection-from-textcommunication'));
app.use('/api/gap-no-emergencyreadinessassessment', require('./routes/gap-no-emergencyreadinessassessment'));
app.use('/api/gap-no-firstresponderbrief-autogeneration', require('./routes/gap-no-firstresponderbrief-autogeneration'));
app.use('/api/gap-no-mentalhealthreferral-ai-triage', require('./routes/gap-no-mentalhealthreferral-ai-triage'));
app.use('/api/gap-limited-anonymous-reporting-tips-route-exist', require('./routes/gap-limited-anonymous-reporting-tips-route-exist'));
app.use('/api/gap-no-sospanic-alert-system-integration', require('./routes/gap-no-sospanic-alert-system-integration'));
app.use('/api/gap-no-massnotification-smsvoice-emergency-comms', require('./routes/gap-no-massnotification-smsvoice-emergency-comms'));
app.use('/api/gap-no-firstresponder-integration-cad-push', require('./routes/gap-no-firstresponder-integration-cad-push'));
app.use('/api/gap-no-sis-student-information-system-integratio', require('./routes/gap-no-sis-student-information-system-integratio'));
app.use('/api/gap-limited-training-compliance-tracking', require('./routes/gap-limited-training-compliance-tracking'));
// === End Batch 07 ===
