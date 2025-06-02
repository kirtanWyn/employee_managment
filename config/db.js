const { Sequelize, DataTypes, Model } = require("sequelize");
const { sequelize } = require("./connect");
console.log("im in db.js");
var db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Admin = require("../models/admin")(sequelize, DataTypes, Model);
db.Attendance = require("../models/attendance")(sequelize, DataTypes, Model);
db.Employee = require("../models/employee")(sequelize, DataTypes, Model);
db.Document = require("../models/documents")(sequelize, DataTypes, Model);

// ASSOCIATIONS
// Employee - Document
db.Employee.hasMany(db.Document, {
     foreignKey: "employee_id", 
     sourceKey: "employee_id", 
     targetKey: "employee_id" });
db.Document.belongsTo(db.Employee, { 
    foreignKey: "employee_id", 
    sourceKey: "employee_id", 
    targetKey: "employee_id" });

// Employee - Attendance
db.Employee.hasMany(db.Attendance, { 
    foreignKey: "employee_id", 
    sourceKey: "employee_id", 
    targetKey: "employee_id" });
db.Attendance.belongsTo(db.Employee, { 
    foreignKey: "employee_id", 
    sourceKey: "employee_id", 
    targetKey: "employee_id" });

console.log("im out of db.js");
module.exports = { db };
