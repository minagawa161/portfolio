"use strict";

import gulp from "gulp";
import gulpLoadPlugins from "gulp-load-plugins";
import htmlhint from "gulp-htmlhint";
import config from "../config.js";
const $ = gulpLoadPlugins();

/**
 * 公開用のHTMLファイルを解析して警告やエラーを通知します。
 */
const htmlValidate = () => {
  // 範囲を限定する場合は`products/`などと指定します。
  return gulp
    .src(config.dist + `/**/*.html`)
    .pipe(
      $.plumber({
        errorHandler: $.notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(htmlhint(".htmlhintrc"))
    .pipe(htmlhint.reporter("htmlhint-stylish"));
  // .pipe(htmlhint.failOnError({ suppress: true })) // タスクを止めてエラーを出力する場合
};

exports.htmlValidate = htmlValidate;
