const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors({
  origin: `http://localhost:${process.env.CLIENT_PORT || 3000}`,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
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
