import cron from 'node-cron';
import Subscription from '../models/subscription.model.js';

// Chạy mỗi giờ — expire subscription đã quá hạn endDate
const startSubscriptionExpiryJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await Subscription.updateMany(
        {
          status:  'active',
          endDate: { $ne: null, $lte: new Date() },
        },
        { $set: { status: 'expired' } },
      );

      if (result.modifiedCount > 0) {
        console.log(`[subscription-expiry] Expired ${result.modifiedCount} subscription(s)`);
      }
    } catch (err) {
      console.error('[subscription-expiry] Job failed:', err.message);
    }
  });

  console.log('[subscription-expiry] Job scheduled (every hour)');
};

export default startSubscriptionExpiryJob;
