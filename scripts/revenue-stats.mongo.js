// Monthly revenue Uppush generated for merchants — the real numbers behind the
// home-page growth chart (src/data/growth-stats.json).
//
// Same definition the app uses for "Revenue from Uppush" (modules/statistic):
// placed_orders with isRevenue: true (attributed to a campaign or automation),
// excluding test and cancelled orders. Grouped by month and by the store's currency,
// because totalPrice is in each shop's own currency.
//
//   mongosh "<connection string>" --quiet scripts/revenue-stats.mongo.js > revenue-stats.json
//
// Then convert non-USD rows to USD (monthly average rate), sum per month, paste into
// growth-stats.json and set "verified": true. Read-only: this script never writes.
const MONTHS = 12;
const since = new Date();
since.setUTCDate(1);
since.setUTCHours(0, 0, 0, 0);
since.setUTCMonth(since.getUTCMonth() - MONTHS);

const rows = db.placed_orders
  .aggregate(
    [
      { $match: { isRevenue: true, createdAt: { $gte: since }, test: { $ne: true }, cancelledAt: null } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'shop', pipeline: [{ $project: { currencyCode: 1 } }] } },
      { $unwind: '$shop' },
      {
        $group: {
          _id: { month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, currency: '$shop.currencyCode' },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
          stores: { $addToSet: '$user' },
        },
      },
      { $project: { _id: 0, month: '$_id.month', currency: '$_id.currency', revenue: { $round: ['$revenue', 2] }, orders: 1, stores: { $size: '$stores' } } },
      { $sort: { month: 1, revenue: -1 } },
    ],
    { allowDiskUse: true },
  )
  .toArray();

print(JSON.stringify(rows, null, 2));
