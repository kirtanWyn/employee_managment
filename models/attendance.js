module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define(
    "attendance",
    {
      attendance_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_employee",
          key: "employee_id",
        },
        onDelete: "CASCADE",
      },

      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("present", "absent", "half_day"),
        allowNull: false,
      },

    },
    {
      tableName: "tbl_attendance",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["employee_id", "date"],
        },
      ],
    }
  );

  return Attendance;
};
