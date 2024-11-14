import minimist from "minimist";
let envOption = {
  string: "env",
  default: { env: process.env.NODE_ENV || "dev" } // NODE_ENVに指定がなければ開発モードをデフォルトにする
};
const options = minimist(process.argv.slice(2), envOption);
export default (options.env === "production" ? true : false);
