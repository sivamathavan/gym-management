const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { getInsights, askAI } = require('../controllers/aiController');
const r = Router();
r.use(authenticate);
r.get('/insights', getInsights);
r.post('/ask', askAI);
module.exports = r;
