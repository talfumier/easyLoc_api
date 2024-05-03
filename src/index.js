import {Sequelize} from "sequelize";
import mongoose from "mongoose";
import express from "express";
import {defineSqlServerModels} from "./models/sqlServerModels.js";
import config from "./config/config.json" assert {type: "json"};
import {environment} from "./config/environment.js";
import {routes} from "./routes/routes.js";

/*DEALING MITH MS SQL SERVER*/
const sqlServerConnection = new Sequelize(
  config.sql_db_name,
  environment.production ? process.env.EASYLOC_DB_USER : environment.user,
  environment.production ? process.env.EASYLOC_DB_USERPWD : environment.userPwd,
  {
    dialect: "mysql",
    host: environment.production
      ? config.sql_db_host_prod
      : config.sql_db_host_dev,
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
const db_type = `${environment.production ? "MySQL" : "MS SQL"}`;

let flg = 0; //error flag if any
sqlServerConnection
  .authenticate()
  .then(() => {
    flg += 1; //indicates a successful connection
    console.log(`[API]: successfully connected to ${db_type} server !`);
    return sqlServerConnection.sync({alter: true}); //returned promise should sync all tables and models, alter=true means update tables where actual model definition has changed
  })
  .then(() => {
    console.log(`[API]: ${db_type} tables and models successfully synced !`);
  })
  .catch((err) => {
    // at this stage, one error has occured
    let msg = "";
    switch (flg) {
      case 0: //connection failure
        msg = `[API]: failed to connect to ${db_type} server !`;
        break;
      case 1: //connection succeeded but sync operation has failed
        msg = `${db_type} tables and models syncing failed !`;
    }
    console.log(msg, err.message);
  });
/*DEALING WITH MONGO DB*/
mongoose
  .connect(
    !environment.production
      ? config.mongo_db_connection_dev
          .replace("user", environment.user)
          .replace("pwd", environment.userPwd)
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
    `[API]: ${
      !environment.production ? "development" : "production"
    } server is listening on port ${port} 🚀`
  );
});
