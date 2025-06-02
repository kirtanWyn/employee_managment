module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    "document",
    {
      document_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_employee", // Table name of the referenced model
          key: "employee_id",
        },
        onDelete: "CASCADE",
      },

      file_path: {
        type: DataTypes.STRING(255), // Path or URL to the uploaded file
        allowNull: false,
      },

    },
    {
      tableName: "tbl_documents",
      timestamps: true, 
    }
  );

  return Document;
};
