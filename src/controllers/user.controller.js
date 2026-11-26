const userService = require('../services/user.service');

async function getAll(req, res) {
  const users = await userService.getAll(req.query);
  res.status(200).json(users);
}

async function create(req, res) {
  const user = await userService.create(req.body);

  res.status(201).json(user);
}

async function uploadFile(req, res) {
  const updated = await userService.uploadFile(req.params.id, req.file, req.body?.documentType);
  res.status(201).json({ user: updated });
}

module.exports = { uploadFile, getAll, create };
