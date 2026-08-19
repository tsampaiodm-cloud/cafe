const express = require('express');
const profileController = require('../controllers/profileController');
const { validateBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/requireAuth');
const { profileUpdateSchema } = require('../utils/validators');

const router = express.Router();

// Todas as rotas de perfil exigem autenticação — sem exceção.
router.use(requireAuth);

router.get('/', profileController.getMyProfile);
router.patch('/', validateBody(profileUpdateSchema), profileController.updateMyProfile);

module.exports = router;
