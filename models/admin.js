module.exports = (sequelize, DataTypes) => {
    const Admin = sequelize.define(
        "admin",
        {
            admin_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            token_version: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: "tbl_admin", 
            timestamps: true, 
        }
    );

    return Admin;
};
