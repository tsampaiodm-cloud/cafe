const express = require('express');
const postController = require('../controllers/postController');
const { validateBody, validateQuery } = require('../middleware/validate');
const { requireAuth } = require('../middleware/requireAuth');
const { postSchema, commentSchema, feedQuerySchema } = require('../utils/validators');

const router = express.Router();

// IMPORTANTE: '/feed' e '/diario' precisam vir ANTES de '/:id',
// senão o Express trataria "feed"/"diario" como um id de post.
router.get('/feed', validateQuery(feedQuerySchema), postController.getFeed);
router.get('/diario', requireAuth, postController.getDiario);
router.get('/:id', postController.getPost);

router.post('/', requireAuth, validateBody(postSchema), postController.postCreate);
router.post('/:id/publish', requireAuth, postController.postPublish);
router.post('/:id/like', requireAuth, postController.postLike);
router.post('/:id/comments', requireAuth, validateBody(commentSchema), postController.postComment);

module.exports = router;
