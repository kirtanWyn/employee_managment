// models/Leave.js
module.exports = (sequelize, DataTypes) => {
  const Leave = sequelize.define("Leave", {
    leave_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
  },
      {
      tableName: "tbl_leave",
      timestamps: true, // adds createdAt and updatedAt
    }
);

//   Leave.associate = (models) => {
//     Leave.belongsTo(models.Employee, {
//       foreignKey: "employee_id",
//     });
//   };

  return Leave;
};
