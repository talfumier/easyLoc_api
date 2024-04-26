// import fs from "fs";
// import path from "path";
// import {fileURLToPath} from "url";

const setEnv = () => {
  const fs = require("fs");
  const writeFile = fs.writeFile;
  const path = require("path");
  // const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const targetPath = path.join(__dirname, "/environment.cjs");

  const configFile = `export const environment = {
    user: '${process.env.EASYLOC_DB_USER}',
    userPwd: '${process.env.EASYLOC_DB_USERPWD}',
    production: true,
  };`;
  writeFile(targetPath, configFile, (err) => {
    if (err) console.error(err);
    else
      console.log(
        `Node.js environment.js file generated correctly at ${targetPath} \n`
      );
  });
};

setEnv();
