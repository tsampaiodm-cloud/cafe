const userService = require('../services/userService');

async function getMyProfile(req, res, next) {
  try {
    const profile = await userService.getProfile(req.user.id);
    return res.json({ profile });
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    // req.user.id vem do JWT verificado, nunca do body — mesmo que
    // alguém tente mandar { "id": "<outro-uuid>" } no payload, o
    // updateProfile só é chamado com o id da própria sessão, e a
    // policy profiles_update_own barra qualquer tentativa de UPDATE
    // fora disso no nível do banco.
    const profile = await userService.updateProfile(req.user.id, req.body);
    return res.json({ profile });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyProfile, updateMyProfile };
