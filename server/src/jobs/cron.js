import cron from 'node-cron';
import Need from '../models/Need.js';

export const startCronJobs = () => {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Cron] Running predictive urgency bump...');
    try {
      // Find open needs created > 48 hours ago
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      
      const staleNeeds = await Need.find({
        status: 'open',
        createdAt: { $lte: fortyEightHoursAgo },
        urgency: { $lt: 5 } // Only bump if urgency is not already max
      });

      for (const need of staleNeeds) {
        need.urgency += 1;
        console.log(`[Cron] Bumped urgency for need: ${need.title} to ${need.urgency}`);
        // This will trigger the pre-save hook and recalculate priorityScore
        await need.save();
      }
      console.log(`[Cron] Processed ${staleNeeds.length} stale needs.`);
    } catch (error) {
      console.error('[Cron] Error running urgency bump:', error);
    }
  });
};
