require("dotenv").config();
const { Sequelize, DataTypes, Model } = require("sequelize");
console.log("im in connect.js");

const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DBUSER,
  process.env.DBPASSWORD,
  {
    host: process.env.DBHOST,
    logging: false,
    dialect: "mysql"
  });

console.log("im out of connect.js");

//comment below line if you don't want to logs of execution api query 
sequelize.options.logging = console.log;

module.exports = { sequelize }