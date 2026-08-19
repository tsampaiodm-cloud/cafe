const postService = require('../services/postService');

async function getFeed(req, res, next) {
  try {
    const posts = await postService.listFeed(req.query);
    return res.json({ posts });
  } catch (err) {
    next(err);
  }
}

async function getDiario(req, res, next) {
  try {
    const posts = await postService.listDiario(req.user.id);
    return res.json({ posts });
  } catch (err) {
    next(err);
  }
}

async function getPost(req, res, next) {
  try {
    const post = await postService.getPostDetail(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'not_found', message: 'Post não encontrado.' });
    }
    return res.json({ post });
  } catch (err) {
    next(err);
  }
}

async function postCreate(req, res, next) {
  try {
    const post = await postService.createPost(req.user.id, req.body);
    return res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

async function postPublish(req, res, next) {
  try {
    const post = await postService.publishToFeed(req.user.id, req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'not_found', message: 'Post não encontrado ou já publicado.' });
    }
    return res.json({ post });
  } catch (err) {
    next(err);
  }
}

async function postLike(req, res, next) {
  try {
    const result = await postService.toggleLike(req.user.id, req.params.id);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function postComment(req, res, next) {
  try {
    const comment = await postService.createComment(req.user.id, req.params.id, req.body);
    return res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFeed, getDiario, getPost, postCreate, postPublish, postLike, postComment };
