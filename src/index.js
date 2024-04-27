import {Sequelize} from "sequelize";
import mongoose from "mongoose";
import express from "express";
import {defineSqlServerModels} from "./models/sqlServerModels.js";
import config from "./config/config.json" assert {type: "json"};
import {environment_local} from "./config/environment-local.js";
import {routes} from "./routes/routes.js";

/*DEALING MITH MS SQL SERVER*/
const sqlServerConnection = new Sequelize(
  config.sql_db_name,
  process.env.Node_ENV === "development"
    ? environment_local.user
    : process.env.EASYLOC_DB_USER,
  process.env.Node_ENV === "development"
    ? environment_local.userPwd
    : process.env.EASYLOC_DB_USERPWD,
  {
    dialect: "mssql",
    host:
      process.env.Node_ENV === "development"
        ? config.sql_db_host_dev
        : config.sql_db_host_prod,
    logging: false,
  }
);
//define models
const sqlModels = defineSqlServerModels(sqlServerConnection);
//define relationships
sqlModels.Billing.belongsTo(sqlModels.Contract, {
  foreignKey: "contract_id",
});
sqlModels.Contract.hasMany(sqlModels.Billing, {
  foreignKey: "contract_id",
});

let flg = 0; //error flag if any
sqlServerConnection
  .authenticate()
  .then(() => {
    flg += 1; //indicates a successful connection
    console.log("[API]: successfully connected to MS SQL Server !");
    return sqlServerConnection.sync({alter: true}); //returned promise should sync all tables and models, alter=true means update tables where actual model definition has changed
  })
  .then(() => {
    console.log("SqlServer tables and models successfully synced !");
  })
  .catch((err) => {
    // at this stage, one error has occured
    let msg = "";
    switch (flg) {
      case 0: //connection failure
        msg = "[API]: failed to connect to MS SQL Server !";
        break;
      case 1: //connection succeeded but sync operation has failed
        msg = "SqlServer tables and models syncing failed !";
    }
    console.log(msg, err.message);
  });
/*DEALING WITH MONGO DB*/
mongoose
  .connect(
    process.env.NODE_ENV === "development"
      ? config.mongo_db_connection_dev
          .replace("user", environment_local.user)
          .replace("pwd", environment_local.userPwd)
      : config.mongo_db_connection_prod
          .replace("user", process.env.EASYLOC_DB_USER)
          .replace("pwd", process.env.EASYLOC_DB_USERPWD)
  )
  .then(() => {
    console.log("[API]: successfully connected to MongoDB server !");
  })
  .catch((err) => {
    console.log("[API]: failed to connect to MongoDB server !", err.message);
  });
/*DEALING WITH EXPRESS*/
const app = express();
routes(app); //request pipeline including error handling

const port = process.env.PORT || 8000;
app.listen(port, () => {
  return console.log(
    `Express server is listening at http://localhost:${port} 🚀`
  );
});
