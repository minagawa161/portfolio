"use strict";

const path = require("path");
const webpack = require("webpack");
const glob = require("glob");
import config from "./config.js";

import minimist from "minimist";
const envOption = {
  string: "env",
  default: { env: process.env.NODE_ENV || "dev" }, // NODE_ENVに指定がなければ開発モードをデフォルトにする
};
const options = minimist(process.argv.slice(2), envOption);
const isProduction = options.env === "production";

const src = path.resolve(__dirname, config.src);
console.log(src);

const webpackConfig = {
  entry: {},

  output: {
    path: path.join(__dirname, "/js"),
    filename: "[name].js",
  },

  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: "ts-loader",
      },
      {
        test: /\.(frag|vert|glsl)$/,
        exclude: "/node_modules/",
        use: ["raw-loader", "glslify-loader"],
      },
    ],
  },
};

glob
  .sync(`**/*+(.js|.ts)`, {
    cwd: config.src,
    ignore: `**/_*+(.js|.ts)`,
  })
  .forEach((globPath) => {
    const entryName = globPath.replace(/^(.+)\..+$/, "$1");
    webpackConfig.entry[entryName] = path.resolve(config.src, globPath);
  });

if (isProduction) {
  // JS圧縮
  webpackConfig.mode = "production";
} else {
  webpackConfig.devtool = "source-map";
  webpackConfig.cache = true;
  webpackConfig.mode = "development";
}

module.exports = webpackConfig;
