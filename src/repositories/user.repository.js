const User = require('../models/user.model');

const fields = '_id name email role';

function getAll({ skip, limit }) {
  return User.find()
    .select(fields)
    .sort({ name: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

function getById(id) {
  return User.findById(id).select(fields).lean();
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

function addFile(id, metadata) {
  return User.findByIdAndUpdate(
    id,
    { $push: { documents: metadata } },
    { new: true, runValidators: true },
  ).select(fields + ' documents').lean();
}

module.exports = { getAll, getById, addFile, create };
