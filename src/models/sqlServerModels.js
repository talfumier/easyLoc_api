import {DataTypes} from "sequelize";

export function defineSqlServerModels(sqlServerConnection) {
  const Contract = sqlServerConnection.define("contracts", {
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    vehicle_id: {type: DataTypes.INTEGER, allowNull: false},
    customer_id: {type: DataTypes.INTEGER, allowNull: false},
    sign_datetime: {type: DataTypes.DATE, allowNull: false},
    loc_begin_datetime: {type: DataTypes.DATE, allowNull: true},
    loc_returning_datetime: {type: DataTypes.DATE, allowNull: true},
    price: {type: DataTypes.DECIMAL, allowNull: true},
  });
  const Billing = sqlServerConnection.define("billings", {
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    contract_id: {type: DataTypes.INTEGER, allowNull: false},
    amount: {type: DataTypes.DECIMAL, allowNull: true},
  });
  return {Contract, Billing};
}
