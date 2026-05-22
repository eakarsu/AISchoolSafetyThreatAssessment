const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.status(503).json({ error: 'tipsPublic endpoint not yet implemented' }));
router.post('/', (req, res) => res.status(503).json({ error: 'tipsPublic endpoint not yet implemented' }));

module.exports = router;
