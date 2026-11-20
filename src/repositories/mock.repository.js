const User = require('../models/user.model');
const Order = require('../models/order.model');
const Delivery = require('../models/delivery.model');

async function insertBatch({ users, orders = [], deliveries = [] }) {
  const groups = [
    { model: User, records: users },
    { model: Order, records: orders },
    { model: Delivery, records: deliveries },
  ];

  const attempted = [];
  let inserted = 0;

  try {
    for (const group of groups) {
      if (!group.records.length) continue;

      attempted.push(group);
      const saved = await group.model.insertMany(group.records);
      inserted += saved.length;
    }
  } catch (error) {
    // Se limpia este lote en orden inverso para no dejar referencias sin origen.
    for (const { model, records } of attempted.reverse()) {
      const ids = records.map((record) => record._id);
      await model.deleteMany({ _id: { $in: ids } });
    }

    throw error;
  }

  return inserted;
}

module.exports = { insertBatch };
