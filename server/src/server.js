import app from './app.js';
import { connectDB } from './config/db.js';
import { startCronJobs } from './jobs/cron.js';

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Start Background Jobs
startCronJobs();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
