"use strict";

import gulp from "gulp";
import config from "../config.js";

import { pug } from "./pug";
import { htmlValidate } from "./lint";
import { compileSass } from "./sass";
import { bundleWebpack } from "./webpack";
import { copy } from "./copy";
import { convertwebp } from "./convertwebp";

const watch = () => {
  // ファイル監視 ＆ 自動リロード
  gulp.watch([config.src + "/**/*.pug"], gulp.series(pug, htmlValidate));
  gulp.watch([config.src + "/**/*.scss"], compileSass);
  gulp.watch([config.src + "/**/*+(.js|.ts|.glsl)"], bundleWebpack);
  gulp.watch([config.src + `/**/*.{jpg,jpeg,png}`], convertwebp);
  gulp.watch(
    [
      config.src + `/**/*+(.png|.jpeg|.jpg|.gif|.webp|.svg|.ico|.mp4|.pdf)`,
      config.src + `/**/*.ico`,
      config.src + `/**/fonts/**/*`,
      config.src + `/**/*.vert`,
      config.src + `/**/*.frag`,
      config.src + `/**/*.css`,
      config.src + `/**/*.html`,
      config.src + `/**/*.json`,
      "!" + config.src + "/**/pages.json",
    ],
    copy
  );
};
exports.watch = watch;
