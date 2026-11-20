const AppError = require('../errors/app.error');
const userRepository = require('../repositories/user.repository');
const { USER_ROLES } = require('../utils/constants');

function getAll() {
  return userRepository.getAll();
}

async function create(data = {}) {
  const { name, email } = data ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    throw new AppError('INVALID_USER_NAME');
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AppError('INVALID_EMAIL');
  }

  const user = await userRepository.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: USER_ROLES.USER,
  });

  if (user === null) throw new AppError('EMAIL_ALREADY_EXISTS');

  return user;
}

module.exports = { getAll, create };
