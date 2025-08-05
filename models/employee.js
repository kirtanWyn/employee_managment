module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    "employee",
    {
      // Primary key (auto-increment)
      employee_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      // country_code: {
      //   type: DataTypes.STRING,
      // },

      mobile_number: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: false, // Ensure uniqueness of email addresses
        validate: {
          isEmail: true, // Validate email format using built-in validator
        },
      },
      designation: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      hobby: {
        type: DataTypes.TEXT,  // Array of strings
        allowNull: true,
      },
      profile_photo: {
        type: DataTypes.STRING(255), // Path or URL to image
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },

      salary: {
        type: DataTypes.DECIMAL(10, 2), // e.g., 99999999.99 max
        allowNull: true,
        validate: {
          min: 0,
        },
      },

    },
    {
      tableName: "tbl_employee",
      timestamps: true, // adds createdAt and updatedAt
    }
  );

  return Employee;
};
