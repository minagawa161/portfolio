"use strict";

import gulp from "gulp";
const sass = require("gulp-sass")(require("sass"));
import sassGlob from "gulp-sass-glob-use-forward";
import gulpLoadPlugins from "gulp-load-plugins";
import autoprefixer from "autoprefixer";
import browserSync from "browser-sync";
import mqpacker from "css-mqpacker";
import sortCSSmq from "sort-css-media-queries";
import config from "../config.js";
import isProduct from "../isProduct.js";

const $ = gulpLoadPlugins();

// sassをトランスパイル
const compileSass = () => {
  // postcssのプラグイン
  const plugins = [
    // ベンダープレフィックス自動付与
    autoprefixer(),
    // メディアクエリをまとめる
    mqpacker({
      // sort: sortCSSmq // PCファースト
      sort: true, // モバイルファースト
    }),
  ];

  const dependentsConfig = {
    ".scss": {
      parserSteps: [
        /(?:^|;|{|}|\*\/)\s*@(import|use|forward|include)\s+((?:"[^"]+"|'[^']+'|url\((?:"[^"]+"|'[^']+'|[^)]+)\)|meta\.load\-css\((?:"[^"]+"|'[^']+'|[^)]+)\))(?:\s*,\s*(?:"[^"]+"|'[^']+'|url\((?:"[^"]+"|'[^']+'|[^)]+)\)|meta\.load\-css\((?:"[^"]+"|'[^']+'|[^)]+)\)))*)(?=[^;]*;)/gm,
        /"([^"]+)"|'([^']+)'|url\((?:"([^"]+)"|'([^']+)'|([^)]+))\)|meta\.load\-css\((?:"([^"]+)"|'([^']+)'|([^)]+))\)/gm,
      ],
      prefixes: ["_"],
      postfixes: [".scss", ".sass"],
      basePaths: [],
    },
  };

  return gulp
    .src(config.src + `/**/*.scss`)
    .pipe(sassGlob())
    .pipe(
      $.plumber({
        errorHandler: $.notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe($.if(!isProduct, $.cached("style"))) //キャッシュ
    .pipe($.if(!isProduct, $.dependents(dependentsConfig))) // 依存関係を解決してキャッシュを反映, 差分ビルド
    .pipe($.if(!isProduct, $.sourcemaps.init()))
    .pipe(sassGlob())
    .pipe(
      sass.sync({
        outputStyle: "compressed",
        includePaths: ["node_modules", config.scss],
      })
    )
    .pipe($.postcss(plugins))
    .pipe($.if(!isProduct, $.sourcemaps.write("./")))
    .pipe(gulp.dest(config.dist))
    .pipe(browserSync.stream());
};

exports.compileSass = compileSass;
