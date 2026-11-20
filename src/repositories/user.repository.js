const User = require('../models/user.model');

const fields = '_id name email role';

function getAll() {
  return User.find().select(fields).sort({ name: 1, _id: 1 }).lean();
}

async function create(data) {
  try {
    const user = await User.create(data);
    const { _id, name, email, role } = user;
    return { _id, name, email, role };
  } catch (error) {
    if (error.code === 11000) {
      return null;
    }

    throw error;
  }
}

module.exports = { getAll, create };
