const userRepository = require('../repositories/user.repository');
const { USER_ROLES } = require('../utils/constants');

function getAll() {
  return userRepository.getAll();
}

async function create(data = {}) {
  const { name, email } = data ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'El nombre del usuario es obligatorio.' };
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { error: 'El correo electrónico no es válido.' };
  }

  const user = await userRepository.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: USER_ROLES.USER,
  });

  return user ?? { error: 'El correo electrónico ya está registrado.', duplicate: true };
}

module.exports = { getAll, create };
