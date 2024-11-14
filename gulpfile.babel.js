"use strict";

import gulp from "gulp";

import { clean } from "./gulp/tasks/clean";
import { copy } from "./gulp/tasks/copy";
import { pug } from "./gulp/tasks/pug";
import { htmlValidate } from "./gulp/tasks/lint";
import { compileSass } from "./gulp/tasks/sass";
import { bundleWebpack } from "./gulp/tasks/webpack";
import { server } from "./gulp/tasks/server";
import { watch } from "./gulp/tasks/watch";

exports.default = gulp.series(
  clean,
  copy,
  gulp.parallel(gulp.series(pug, htmlValidate), compileSass, bundleWebpack),
  gulp.parallel(server, watch)
);

exports.build = gulp.series(
  clean,
  copy,
  gulp.parallel(pug, compileSass, bundleWebpack)
);
