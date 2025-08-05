require("sequelize");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const { Op, where } = require("sequelize");
const fs = require("fs").promises;
const { db } = require("../config/db");
const path = require('path');
const moment = require("moment");

const emailFun = require("../services/emailService");

const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'admin123';

async function safeUnlink(filePath) {
  try {
    await fs.access(filePath);  // Check if file exists
    await fs.unlink(filePath);  // Delete file
  } catch (err) {
    // If file doesn't exist or can't be deleted, just log and skip
    console.warn(`Skipping unlink for ${filePath}: ${err.message}`);
  }
}

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check hardcoded credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {

      const adminRecord = await db.Admin.findOne();
      const randomNumber = Math.floor(1 + Math.random() * 9);
      adminRecord.token_version += randomNumber;
      await adminRecord.save();

      // Create JWT with token_version
      const token = jwt.sign(
        { token_version: adminRecord.token_version },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
      });
    }

    return res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const createEmployee = async (req, res) => {
  try {
    const { name, mobile_number, designation, email, hobby, salary, reason } = req.body;
    const { profile_photo, documents } = req.files;


    const ext = profile_photo[0].originalname.split(".").pop();
    const imageUrlMedia = profile_photo[0].filename;
    const imageUrlWithExt = `${profile_photo[0].filename}.${ext}`;
    await fs.rename(`uploads/document/${imageUrlMedia}`, `uploads/document/${imageUrlWithExt}`);
    const profile_photo_url = `uploads/document/${imageUrlWithExt}`

    let hobbyToSave = null;
    if (typeof hobby === "string" && hobby.trim().length > 0) {
      hobbyToSave = hobby.split(",").map(s => s.trim()).join(", "); // optional: clean spaces
    }
    // Create employee
    console.log("hobbyToSave>>.", hobbyToSave);

    const newEmployee = await db.Employee.create({
      name,
      mobile_number,
      designation,
      email,
      hobby: hobbyToSave,
      salary,
      profile_photo: profile_photo_url,
    });

    await db.SalaryHistory.create({
      employee_id: newEmployee.employee_id,
      salary: salary,
      change_reason: reason || "Salary update",
    });

    // Then update employee table
    // employee.salary = newSalary;
    // await employee.save();
    await Promise.all(documents.map(async (element, index) => {
      console.log("im in documents");
      const ext = element.originalname.split(".").pop();
      const imageUrlMedia = element.filename;
      const imageUrlWithExt = `${element.filename}.${ext}`;

      await fs.rename(
        `uploads/document/${imageUrlMedia}`,
        `uploads/document/${imageUrlWithExt}`
      );

      await db.Document.create({
        employee_id: newEmployee.employee_id,
        file_path: `uploads/document/${imageUrlWithExt}`,
      });
    }));

    res.status(201).json({
      message: "Employee created successfully",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
const getEmployees = async (req, res) => {
  try {
    const { search = "", page } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const whereCondition = {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { designation: { [Op.like]: `%${search}%` } },
      ],
    };

    // Fetch paginated Active Employees
    const activeEmployees = await db.Employee.findAndCountAll({
      where: { ...whereCondition, status: "active" },
      include: [
        {
          model: db.Document,
          attributes: ["document_id", "file_path", "createdAt"],
        },

      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    // Fetch paginated Inactive Employees
    const inactiveEmployees = await db.Employee.findAndCountAll({
      where: { ...whereCondition, status: "inactive" },
      include: [
        {
          model: db.Document,
          attributes: ["document_id", "file_path", "createdAt"],
        },

      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      active: {
        data: activeEmployees.rows,
        total: activeEmployees.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(activeEmployees.count / limit),
      },
      inactive: {
        data: inactiveEmployees.rows,
        total: inactiveEmployees.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(inactiveEmployees.count / limit),
      },
    });
  } catch (error) {
    console.error("Error retrieving employees:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const updateEmployee = async (req, res) => {
  try {
    const {
      employee_id,
      name,
      mobile_number,
      designation,
      hobby,
      status,
      salary, reason,
    } = req.body;

    const employee = await db.Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    let parsedHobby = employee.hobby;

    if (hobby) {
      if (typeof hobby === "string") {
        // Accept both JSON array string or comma string
        if (hobby.trim().startsWith("[") && hobby.trim().endsWith("]")) {
          try {
            parsedHobby = JSON.parse(hobby).join(", ");
          } catch {
            return res.status(400).json({ message: "Invalid JSON hobby array" });
          }
        } else {
          parsedHobby = hobby;
        }
      } else if (Array.isArray(hobby)) {
        parsedHobby = hobby.join(", ");
      } else {
        return res.status(400).json({ message: "Invalid hobby format" });
      }
    }

    // Handle profile photo (if provided)
    let profilePhotoPath = employee.profile_photo;
    const profilePhoto = req.files?.profile_photo?.[0];

    if (profilePhoto) {
      const ext = path.extname(profilePhoto.originalname);
      const baseName = path.parse(profilePhoto.filename).name;
      const newFilename = `${baseName}${ext}`;
      const oldPath = `uploads/document/${profilePhoto.filename}`;
      const newPath = `uploads/document/${newFilename}`;

      // Rename new photo
      await fs.rename(oldPath, newPath);
      profilePhotoPath = newPath;

      // Delete old photo (if exists and is different)
      if (employee.profile_photo && employee.profile_photo !== profilePhotoPath) {
        try {
          await fs.unlink(employee.profile_photo);
        } catch (err) {
          console.warn("Old profile photo not found or already deleted:", err.message);
        }
      }
    }

    // Update employee
    await employee.update({
      name,
      mobile_number,
      designation,
      hobby: parsedHobby,
      status,
      profile_photo: profilePhotoPath,
      salary: salary
    });
    if (salary) {
      await db.SalaryHistory.create({
        employee_id,
        salary: salary,
        change_reason: reason || "Salary update",
      });
    }

    console.log(">>>>>>><><><><><><><", req.files.documents);

    // Handle documents
    const documents = req.files?.documents || [];
    if (documents.length > 0) {
      await Promise.all(
        documents.map(async (doc) => {
          const ext = path.extname(doc.originalname);
          const baseName = path.parse(doc.filename).name;
          const newFilename = `${baseName}${ext}`;
          const oldPath = `uploads/document/${doc.filename}`;
          const newPath = `uploads/document/${newFilename}`;

          await fs.rename(oldPath, newPath);

          await db.Document.create({
            employee_id: employee.employee_id,
            file_path: newPath,
            file_name: doc.originalname,
          });
        })
      );
    }

    return res.status(200).json({
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const deleteDocument = async (req, res) => {
  try {
    const { document_id } = req.query;

    const document = await db.Document.findByPk(document_id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    // Delete file from server/local
    await safeUnlink(document.file_path);

    // Delete DB record
    await document.destroy();

    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const deleteEmployee = async (req, res) => {
  try {
    const { employee_id } = req.query;

    const employee = await db.Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const profilePhotoPath = path.resolve(employee.profile_photo);

    const documents = await db.Document.findAll({ where: { employee_id } });

    // Use safeUnlink to skip if file missing
    if (employee.profile_photo) {
      await safeUnlink(profilePhotoPath);
    }

    await Promise.all(
      documents.map(doc => {
        console.log("<>>><><><><><><><", doc.file_path);

        if (doc.file_path) {
          return safeUnlink(path.resolve(doc.file_path));
        }
      })
    );

    await db.Document.destroy({ where: { employee_id } });

    await employee.destroy();

    res.status(200).json({ message: "Employee and related files deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};


const markAttendance = async (req, res) => {
  try {
    const { date, attendances } = req.body;

    if (!Array.isArray(attendances)) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // Extract employee_ids
    const ids = attendances.map(a => a.employee_id);

    // Find which employee IDs are valid
    const existingEmployees = await db.Employee.findAll({
      where: { employee_id: ids },
      attributes: ["employee_id"],
    });

    const existingIds = existingEmployees.map(e => e.employee_id);
    const invalidIds = ids.filter(id => !existingIds.includes(id));

    // Return error if any invalid IDs
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: `Invalid employee_id : ${invalidIds.join(", ")}`,
      });
    }
    //  Mark attendance + send email
    await Promise.all(
      attendances.map(async ({ employee_id, status }) => {
        const employee = await db.Employee.findByPk(employee_id, {
          attributes: ["name", "email"],
        });

        await db.Attendance.upsert({
          employee_id,
          date,
          status,
        });

        // Send email
        if (employee?.email) {
          await emailFun.attendanceMark(employee.email, status, employee.name, date);
        }
      })
    );

    return res.status(200).json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const getAttendanceByDate = async (req, res) => {
  try {
    const { search = "", page = 1, date } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Search condition
    const whereCondition = {
      // status: "active",
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { designation: { [Op.like]: `%${search}%` } },
      ],
    };

    // Query
    const result = await db.Employee.findAndCountAll({
      where: whereCondition,
      attributes: ["employee_id", "name", "designation", "createdAt"],
      include: [
        {
          model: db.Attendance,
          required: false, // allow employees without attendance
          where: { date },
          attributes: ["status", "date"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true, // important for count when using include
    });

    return res.status(200).json({
      date,
      data: {
        employees: result.rows,
        total: result.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching attendance by date:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const getAttendanceHistory = async (req, res) => {
  try {
    const { date, page = 1, employee_id } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Build dynamic filter
    const whereCondition = {};
    if (employee_id) {
      const employee = await db.Employee.findByPk(employee_id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      whereCondition.employee_id = employee_id;
    }
    if (date) whereCondition.date = date;

    const result = await db.Attendance.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: db.Employee,
          attributes: ["employee_id", "name", "designation"],
        },
      ],
      order: [["date", "DESC"]],
      limit,
      offset,
      distinct: true, // ensures count is accurate if joined
    });

    return res.status(200).json({
      data: {
        records: result.rows,
        total: result.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.count / limit),
      },
    });
  } catch (error) {
    console.error("Error retrieving attendance history:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const getDashboardSummary = async (req, res) => {
  try {
    const today = moment().format("YYYY-MM-DD"); // current date

    // Get total employees
    const totalActiveEmployees = await db.Employee.count({
      where: { status: "active" },
    });
    const totalInactiveEmployees = await db.Employee.count({
      where: { status: "inactive" },
    });

    // Get attendance counts grouped by status
    const attendanceCounts = await db.Attendance.findAll({
      where: { date: today },
      attributes: ["status", [db.Sequelize.fn("COUNT", db.Sequelize.col("status")), "count"]],
      group: ["status"],
      raw: true,
    });
    const totalAttendanceToday = await db.Attendance.count({
      where: { date: today },
    });

    // Prepare summary
    let summary = {
      totalEmployees: totalActiveEmployees + totalInactiveEmployees,
      activeEmployees: totalActiveEmployees,
      inactiveEmployees: totalInactiveEmployees,
      totalAttendanceToday,
      presentToday: 0,
      absentToday: 0,
      half_dayToday: 0,
    };

    attendanceCounts.forEach(record => {
      if (record.status === "present") summary.presentToday = parseInt(record.count);
      if (record.status === "absent") summary.absentToday = parseInt(record.count);
      if (record.status === "half_day") summary.half_dayToday = parseInt(record.count);
    });

    return res.status(200).json({
      date: today,
      summary,
    });

  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const applyLeave = async (req, res) => {
  try {
    const { employee_id, start_date, end_date, reason } = req.body;

    const isEmployeeExist = await db.Employee.findByPk(employee_id)
    if (!isEmployeeExist) return res.status(404).json({ message: "Employee not exist" })

    const leave = await db.Leave.create({
      employee_id,
      start_date,
      end_date,
      reason,
    });

    return res.status(201).json({
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    console.error("Error applying for leave:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const getLeaves = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereCondition = {};
    if (status) {
      // if (!["pending", "approved", "rejected"].includes(status.toLowerCase())) {
      //   return res.status(400).json({ message: "Invalid status filter" });
      // }
      whereCondition.status = status.toLowerCase();
    }

    const result = await db.Leave.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: db.Employee,
          attributes: ["employee_id", "name", "email", "designation"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total: result.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(result.count / limit),
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const updateLeaveStatus = async (req, res) => {
  try {
    const { leave_id, status } = req.body; // status = "approved" or "rejected"

    const leave = await db.Leave.findByPk(leave_id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    leave.status = status;
    await leave.save();

    return res.status(200).json({
      message: `Leave ${status}`,
      leave,
    });
  } catch (error) {
    console.error("Error updating leave status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const sendMonthlyReports = async () => {
  try {
    const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");

    console.log("Generating report for:", startOfMonth, "to", endOfMonth);

    const employees = await db.Employee.findAll({
      where: { status: "active" },
    });

    for (const emp of employees) {
      const attendanceRecords = await db.Attendance.findAll({
        where: {
          employee_id: emp.employee_id,
          date: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      });

      const leaves = await db.Leave.findAll({
        where: {
          employee_id: emp.employee_id,
          status: "approved",
          [Op.or]: [
            {
              start_date: {
                [Op.between]: [startOfMonth, endOfMonth],
              },
            },
            {
              end_date: {
                [Op.between]: [startOfMonth, endOfMonth],
              },
            },
          ],
        },
      });

      const summary = `
        Monthly Report - ${moment().format("MMMM YYYY")}
        Name: ${emp.name}
        Attendance:
        - Present: ${attendanceRecords.filter(a => a.status === "present").length}
        - Absent: ${attendanceRecords.filter(a => a.status === "absent").length}
        - Half-day: ${attendanceRecords.filter(a => a.status === "half_day").length}

        Leaves Applied & Approved: ${leaves.length}
      `;

      console.log(summary);

      // Uncomment when ready to send
      await emailFun.sendEmail(emp.email, "Monthly Attendance Report", summary);

    }
    console.log("Monthly reports sent.");
    // return res.status(200).json({message: `Monthly reports sent.`});
  } catch (error) {
    console.error("Error sending monthly reports:", error);
    // return res.status(200).json({message: `internal server error`});

  }
};

const getEmployeeSalaryHistory = async (req, res) => {
  try {
    const { employee_id, page = 1, limit = 10 } = req.query;

    // Check if employee exists
    const employee = await db.Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const offset = (page - 1) * limit;

    // Get salary history
    const { rows: history, count: total } = await db.SalaryHistory.findAndCountAll({
      where: { employee_id },
      order: [["updatedAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    if (history.length === 0) {
      return res.status(200).json({ message: "No salary history found", data: [] });
    }

    return res.status(200).json({
      message: "Salary history fetched successfully",
      data: history,
      pagination: {
        total,
        page: parseInt(page),
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching salary history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  adminLogin,

  createEmployee, getEmployees, updateEmployee, deleteDocument, deleteEmployee,

  markAttendance, getAttendanceByDate, getAttendanceHistory,

  getDashboardSummary,

  applyLeave, getLeaves, updateLeaveStatus, 
  sendMonthlyReports , getEmployeeSalaryHistory
};

