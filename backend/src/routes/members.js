const express = require('express');
const r = express.Router();
const c = require('../controllers/membersController');
const { authenticate, requireRole, scopeBranch } = require('../middleware/auth');

r.use(authenticate);

r.get('/', scopeBranch, c.getMembers);
r.get('/stats', c.getMemberStats);
r.get('/:id', c.getMember);
r.post('/', requireRole('super_admin','branch_manager','reception'), c.createMember);
r.put('/:id', requireRole('super_admin','branch_manager','reception'), c.updateMember);
r.get('/:id/renewal-info', c.getRenewalInfo);
r.post('/:id/renew/initiate', c.initiateRenewal);
r.post('/:id/renew/complete', c.completeRenewal);

module.exports = r;
