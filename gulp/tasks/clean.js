"use strict";

import del from "del";
import config from "../config.js";

const clean = () => {
  return del([config.dist + "**/*"], { force: false }).then((paths) => {
    console.log("Deleted files and folders:\n", paths.join("\n"));
  });
};

exports.clean = clean;
