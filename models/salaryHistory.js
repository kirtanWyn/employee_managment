module.exports = (sequelize, DataTypes) => {
  const SalaryHistory = sequelize.define(
    "salary_history",
    {
      salary_history_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_employee", // references table name, not model name
          key: "employee_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      salary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

    //   new_salary: {
    //     type: DataTypes.DECIMAL(10, 2),
    //     allowNull: false,
    //   },

      change_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

    //   changed_at: {
    //     type: DataTypes.DATE,
    //     defaultValue: DataTypes.NOW,
    //   },
    },
    {
      tableName: "tbl_salary_history",
      timestamps: true, // we already have 'changed_at'
    }
  );

  return SalaryHistory;
};
