const { check, validationResult } = require("express-validator");
const multer = require("multer");
const upload = multer({ dest: "uploads/document" });
const rateLimit = require("../middleware/rateLimit")

const { authMiddleware } = require("../middleware/auth");
const fs = require("fs");
const { validateFiles } = require('../utils/fileValidation');

const moment = require("moment");

const validation = (req, res, next) => {
    console.log("API path", `------>BaseUrl/${req.url}`);
    console.log("<<input>>req.query", req.query);
    console.log("<<input>>req.body", req.body);
    console.log("<<input>>req.files", req.files);
    console.log("<<input>>req.file", req.file);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.file) {
            try {

                fs.unlinkSync(req.file.path);
            } catch (error) {
                console.log(error);

            }
        }

        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    try {

                        fs.unlinkSync(file.path);
                    } catch (error) {
                        console.log(error);

                    }
                });
            });
        }
        return res.status(400).json({
            Status: 0,
            message: errors.array()[0].msg,
            type: errors.array()[0].type,
            value: errors.array()[0].value,
            path: errors.array()[0].path,
            location: errors.array()[0].location,
            error: errors
        });
    }
    next();
}

const checkForUnexpectedFields = (allowedFields) => {
    return (req, res, next) => {

        const unexpectedBodyFields = req.body ? Object.keys(req.body).filter(field => !allowedFields.includes(field)) : [];
        const unexpectedQueryFields = req.query ? Object.keys(req.query).filter(field => !allowedFields.includes(field)) : [];
        const unexpectedFileFields = req.files ? Object.keys(req.files).filter(field => !allowedFields.includes(field)) : [];

        if (unexpectedFileFields.length > 0) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);  // Remove the file from the server
                    } catch (error) {
                        console.log("error on checkForUnexpectedFields")
                    }
                });
            });
        }

        const unexpectedFields = [...unexpectedBodyFields, ...unexpectedQueryFields, ...unexpectedFileFields];

        if (unexpectedFields.length > 0) {
            return res.status(400).json({ Status: 0, message: `Unexpected fields: ${unexpectedFields.join(', ')}` });
        }

        next();
    };
};


exports.adminLogin = () => {
    return [
        [
            check("email").not().isEmpty().withMessage("Email is required").trim().escape(),
            check("password").not().isEmpty().withMessage("password is required").trim().escape(),
        ],
        checkForUnexpectedFields(["email", "password"]),
        validation,
        rateLimit.adminLogin(),

    ];
}


exports.createEmployee = () => {
    return [
        upload.fields([{ name: "profile_photo" },
        { name: "documents" }
        ]),
        [
            check("name").notEmpty().withMessage("name is required").trim().escape(),
            check("designation").notEmpty().withMessage("designation is required").trim().escape(),
            check("mobile_number").notEmpty().withMessage("mobile_number is required")
                .isMobilePhone().withMessage("mobile_number must be a valid phone"),
            check("email").notEmpty().withMessage("email is required")
                .isEmail().withMessage("Invalid email format").normalizeEmail(),
            check('hobby')
                .optional()
                .isString()
                .withMessage('hobby must be a string')
                .custom(value => {
                    // Optional: validate comma separated words only
                    const hobbies = value.split(",").map(s => s.trim());
                    if (hobbies.some(h => h.length === 0)) {
                        throw new Error('hobby contains empty values');
                    }
                    return true;
                }),
            // Profile photo validation
            check("profile_photo").custom(async (value, { req }) => {

                if (!req.files || !req.files.profile_photo) {
                    throw new Error("profile_photo is required");
                }
                if (req.files.profile_photo.length > 1) {
                    req.files.profile_photo.forEach(element => {
                        fs.unlinkSync(element.path);
                    });
                    throw new Error('Maximum 1 Profile Photo allowed');
                }
                const valid = await validateFiles(req.files.profile_photo, ["jpg", "jpeg"], 500 * 1024);
                if (!valid.valid) throw new Error(valid.message);

                return true;
            }),
            // Document validation
            check("documents").custom(async (value, { req }) => {
                if (!req.files || !req.files.documents) {
                    throw new Error("documents is required");
                }
                // if (req.files && req.files.length > 0) {
                const valid = await validateFiles(req.files.documents, ["pdf", "doc", "docx"], 5 * 1024 * 1024);
                if (!valid.valid) throw new Error(valid.message);
                // }
                return true;
            }),
        ],

        checkForUnexpectedFields(["name", "designation", "mobile_number", "hobby", "profile_photo", "documents", "email"]),
        validation,
        authMiddleware,
    ];
};
exports.getEmployees = () => {
    return [
        [
            check("search").optional().trim().escape(),
            check("page")
                .notEmpty().withMessage("page is required")
                .isInt({ min: 1 })
                .withMessage("Page must be a positive integer")
                .toInt(),

        ],
        checkForUnexpectedFields(["search", "page"]),
        validation,
        authMiddleware,
    ];
};
exports.updateEmployee = () => {
    return [
        upload.fields([
            { name: "profile_photo" },
            { name: "documents" }]),
        [
            check('employee_id').notEmpty().withMessage('employee_id is required')
                .isInt({ gt: 0 }).withMessage('employee_id is not vaild'),
            check("name").optional().trim().escape(),
            check("designation").optional().trim().escape(),
            check("mobile_number").optional().isMobilePhone().withMessage("Invalid mobile number"),
            check("status").optional().isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'"),

            check('hobby').optional().isString().withMessage('hobby must be a string')
                .custom(value => {
                    // Optional: validate comma separated words only
                    const hobbies = value.split(",").map(s => s.trim());
                    if (hobbies.some(h => h.length === 0)) {
                        throw new Error('hobby contains empty values');
                    }
                    return true;
                }),
            // Profile photo validation
            check("profile_photo").custom(async (value, { req }) => {

                if (req.files && req.files.profile_photo) {

                    if (req.files.profile_photo.length > 1) {
                        req.files.profile_photo.forEach(element => {
                            fs.unlinkSync(element.path);
                        });
                        throw new Error('Maximum 1 Profile Photo allowed');
                    }
                    const valid = await validateFiles(req.files.profile_photo, ["jpg", "jpeg"], 500 * 1024);
                    if (!valid.valid) throw new Error(valid.message);
                }
                return true;
            }),
            // Document validation
            check("documents").custom(async (value, { req }) => {
                if (req.files && req.files.documents && req.files.documents.length > 0) {
                    const valid = await validateFiles(req.files.documents, ["pdf", "doc", "docx"], 5 * 1024 * 1024);
                    if (!valid.valid) throw new Error(valid.message);
                }
                return true;
            }),

        ],
        checkForUnexpectedFields(["employee_id", "name", "designation", "mobile_number", "hobby", "status", "profile_photo", "documents",]),
        validation,
        authMiddleware,
    ];
};
exports.deleteEmployee = () => {
    return [
        [
            check('employee_id').notEmpty().withMessage('employee_id is required')
                .isInt({ gt: 0 }).withMessage('employee_id is not vaild'),
        ],
        checkForUnexpectedFields(["employee_id"]),
        validation,
        authMiddleware,
    ];
};
exports.deleteDocument = () => {
    return [
        [
            check('document_id').notEmpty().withMessage('document_id is required')
                .isInt({ gt: 0 }).withMessage('document_id is not vaild'),
        ],
        checkForUnexpectedFields(["document_id"]),
        validation,
        authMiddleware,
    ];
};


exports.markAttendance = () => {
    return [
        [
            check("date")
                .notEmpty()
                .withMessage("date is required")
                .isISO8601()
                .withMessage("Invalid date format (use YYYY-MM-DD)"),

            check("attendances")
                .isArray({ min: 1 })
                .withMessage("attendances must be a non-empty array"),

            check("attendances.*.employee_id")
                .notEmpty()
                .withMessage("employee_id is required")
                .isInt()
                .withMessage("employee_id must be an integer"),

            check("attendances.*.status")
                .notEmpty()
                .withMessage("status is required")
                .isIn(["present", "absent", "half_day"])
                .withMessage("status must be one of: present, absent, half_day"),
        ],
        checkForUnexpectedFields(["date", "attendances"]),
        validation,
        authMiddleware,
    ];
};

exports.getAttendanceByDate = () => {
    return [
        [
            check("date").notEmpty().withMessage("date is required")
                .isISO8601().withMessage("Invalid date format (use YYYY-MM-DD)"),
            check("search").optional().trim().escape(),
            check("page").notEmpty().withMessage("page is required")
                .isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),

        ],
        checkForUnexpectedFields(["date", "search", "page"]),
        validation,
        authMiddleware,
    ];

};

exports.getAttendanceHistory = () => {
    return [
        [
            check("employee_id").optional().isInt().withMessage("employee_id must be an integer"),
            check("page").notEmpty().withMessage("page is required")
                .isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),
            check("date").optional()
                .isISO8601().withMessage("Invalid date format (use YYYY-MM-DD)"),
        ],
        checkForUnexpectedFields(["employee_id", "page", "date"]),
        validation,
        authMiddleware,
    ];
};

exports.applyLeave = () => {
    return [
        [
            // check("date").optional()
                // .isISO8601().withMessage("Invalid date format (use YYYY-MM-DD)"),
            check("employee_id").notEmpty().withMessage("Employee ID is required")
                .isInt({ min: 1 }).withMessage("Employee ID must be a valid number"),

            check("start_date").notEmpty().withMessage("Start date is required")
                .isISO8601().withMessage("Invalid date format (use YYYY-MM-DD)")
                .isDate().withMessage("Start date must be a valid date")
                .custom((value) => {
                  if (moment(value).isBefore(moment(), "day")) {
                    throw new Error("Start date cannot be in the past");
                  }
                  return true;
                 }),

            check("end_date").notEmpty().withMessage("End date is required")
                .isISO8601().withMessage("Invalid date format (use YYYY-MM-DD)")
                .isDate().withMessage("End date must be a valid date")
                .custom((value, { req }) => {
                if (moment(value).isBefore(req.body.start_date)) {
                        throw new Error("End date must be after start date");
                    }
                    return true;
                 }),

            check("reason").optional().isString().withMessage("Reason must be a string")
                .isLength({ max: 255 }).withMessage("Reason can't exceed 255 characters"),
        ],
        checkForUnexpectedFields(["employee_id", "start_date", "end_date", "reason"]),
        validation,
        // authMiddleware,
    ];
};
exports.getLeaves = () => {
    return [
        [
            check("status").optional().isIn(["pending", "approved", "rejected"])
                    .withMessage("Status must be one of: pending, approved, rejected"),
            check("page").notEmpty().withMessage("Page is required")
                    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
        ],
        checkForUnexpectedFields(["status", "page"]),
        validation,
        authMiddleware,
    ];
}
exports.updateLeaveStatus = () => {
    return [
        [
            check("status").optional().isIn(["approved", "rejected"])
                    .withMessage("Status must be one of: approved, rejected"),
              check("leave_id").notEmpty().withMessage("Leave ID is required")
                .isInt({ min: 1 }).withMessage("Leave ID must be a valid number"),
        ],
        checkForUnexpectedFields(["status", "leave_id"]),
        validation,
        authMiddleware,
    ];
}
