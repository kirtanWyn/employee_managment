require("dotenv").config();
require("./crons/monthlyReport");
const { db } = require("./config/db");

const express = require("express");
const app = express();

const http = require("http")
app.use('/uploads', express.static('uploads'));
app.use(express.json());
const cors = require('cors')
app.use(cors());

const routes = require("./routes/routes")
const validationRouter = require("./utils/routerAuth");

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'My API', version: '1.0.0' },
  },
  apis: ['./routes/routes.js'], // paths to your API docs
};
const specs = swaggerJsdoc(options);
// app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
//
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//
app.get("/", (req, res) => { res.send(`port live on host ${req.socket.localPort}`) });
app.use("/", routes);
app.use(validationRouter);

let httpServer = http.createServer(app)

const start = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('...........Connection has been established successfully........');
    //COMMENT BELOW LINE AFTER FIRST TIME CODE EXECUTION
    //await db.sequelize.sync({ alter: true });
    //await db.Leave.sync({ alter: true });

    const ensureAdminExists = async () => {
      const existing = await db.Admin.findOne();
      if (!existing) {
        await db.Admin.create({ token_version: 0 });
        console.log("✅ Default admin row inserted into tbl_admin.");
      } else {
        console.log("✅ Admin row already exists.");
      }
    };

    ensureAdminExists();

    httpServer.listen(process.env.PORT, () => {
      console.log(` server is running on port ${process.env.PORT}`);
    });

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};
start();
module.exports = { app }; 