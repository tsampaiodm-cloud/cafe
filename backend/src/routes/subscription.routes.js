const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { validateBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/requireAuth');
const { subscriptionSchema } = require('../utils/validators');

const router = express.Router();

// Planos são conteúdo público — dá pra mostrar preços sem estar logado.
router.get('/plans', subscriptionController.getPlans);

router.post('/', requireAuth, validateBody(subscriptionSchema), subscriptionController.postSubscription);
router.get('/me', requireAuth, subscriptionController.getMySubscriptions);
router.post('/:id/cancel', requireAuth, subscriptionController.postCancel);

module.exports = router;
