const express = require("express");
const router = express.Router();
const validation = require('../validation/validation')
const {authMiddleware} = require("../middleware/auth");

console.log("im in  router");
const controller = require("../controllers/controller");

router.post("/adminLogin",validation.adminLogin(),controller.adminLogin);

router.post('/createEmployee',validation.createEmployee(),controller.createEmployee);
router.get('/getEmployees',validation.getEmployees(),controller.getEmployees);
router.put('/updateEmployee',validation.updateEmployee(),controller.updateEmployee);
router.delete('/deleteDocument', validation.deleteDocument(),controller.deleteDocument);
router.delete('/deleteEmployee', validation.deleteEmployee(),controller.deleteEmployee);

router.post("/markAttendance",  validation.markAttendance(), controller.markAttendance);
router.get("/attendanceByDate",  validation.getAttendanceByDate(), controller.getAttendanceByDate);
router.get("/attendanceHistory",  validation.getAttendanceHistory(), controller.getAttendanceHistory);

router.get("/dashboardSummary", authMiddleware , controller.getDashboardSummary);


router.post("/applyLeave",  validation.applyLeave(), controller.applyLeave);
router.get("/getLeaves", validation.getLeaves() , controller.getLeaves);
router.put('/updateLeaveStatus',validation.updateLeaveStatus(),controller.updateLeaveStatus);

//cron job test api
router.get("/monthlyReport", controller.sendMonthlyReports);

router.get("/employeeSalaryHistory", validation.getAttendanceHistory() , controller.getEmployeeSalaryHistory);

console.log("im out of router");
module.exports = router;
