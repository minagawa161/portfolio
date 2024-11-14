"use strict";

const gulp = require("gulp");
const webp = require("gulp-webp");
const rename = require("gulp-rename");

import gulpLoadPlugins from "gulp-load-plugins";
import config from "../config.js";

const $ = gulpLoadPlugins();

const convertwebp = () => {
  return gulp
    .src(config.src + `/**/*.{jpg,jpeg,png}`)
    .pipe(
      rename(function (path) {
        path.basename += path.extname;
      })
    )
    .pipe(
      webp({
        // この部分でwebpの画像クオリティを決めれる（下記の２行）
        // qualityオプション（デフォルト75） と methodオプション（デフォルト4 0(最速) から6(最も遅い)）
        quality: 80,
        method: 5,
      })
    )
    .pipe($.changed(config.dist))
    .pipe(gulp.dest(config.src));
};

exports.convertwebp = convertwebp;
