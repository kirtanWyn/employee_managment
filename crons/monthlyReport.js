// crons/monthlyReport.js

const cron = require("node-cron");
const { sendMonthlyReports } = require("../controllers/controller");

// Every 1st of month at 9:00 AM
cron.schedule("0 9 1 * *", () => {
  console.log("Running monthly report cron job...");
  sendMonthlyReports();
});
