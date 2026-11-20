const userService = require('../services/user.service');

async function getAll(req, res) {
  const users = await userService.getAll();
  res.status(200).json(users);
}

async function create(req, res) {
  const user = await userService.create(req.body);

  if (user.error) {
    return res.status(user.duplicate ? 409 : 400).json({ error: user.error });
  }

  res.status(201).json(user);
}

module.exports = { getAll, create };
