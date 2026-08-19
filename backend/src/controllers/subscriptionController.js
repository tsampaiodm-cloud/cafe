const subscriptionService = require('../services/subscriptionService');

async function getPlans(req, res, next) {
  try {
    const data = await subscriptionService.getPlansAndConfig();
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

async function postSubscription(req, res, next) {
  try {
    const result = await subscriptionService.createSubscription(req.user.id, req.body);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getMySubscriptions(req, res, next) {
  try {
    const subscriptions = await subscriptionService.listMySubscriptions(req.user.id);
    return res.json({ subscriptions });
  } catch (err) {
    next(err);
  }
}

async function postCancel(req, res, next) {
  try {
    const subscription = await subscriptionService.cancelSubscription(req.user.id, req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: 'not_found', message: 'Assinatura não encontrada.' });
    }
    return res.json({ subscription });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPlans, postSubscription, getMySubscriptions, postCancel };
