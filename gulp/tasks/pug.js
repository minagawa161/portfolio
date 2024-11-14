"use strict";

import gulp from "gulp";
import gulpLoadPlugins from "gulp-load-plugins";
import browserSync from "browser-sync";
import config from "../config.js";
import path from "path";
import fs from "fs";
import imageSize from "image-size";

const $ = gulpLoadPlugins();

const pug = () => {
  // JSONファイルの読み込み。
  const locals = {
    data: JSON.parse(fs.readFileSync(config.pug + "/pages.json")),
  };
  return (
    gulp
      .src([config.src + "/**/*.pug", "!" + config.src + "/**/_*.pug"])
      .pipe(
        $.plumber({
          errorHandler: $.notify.onError("Error: <%= error.message %>"),
        })
      )
      .pipe($.changed(config.dist))
      // 各ページごとの`/`を除いたルート相対パスを取得します。
      .pipe(
        $.data(function (file) {
          locals.relativePath = path.relative(
            file.base,
            file.path.replace(/.pug$/, ".html")
          );
          return locals;
        })
      )
      .pipe(
        $.data(function (file) {
          return {
            // https://zenn.dev/ko_yelie/articles/2d040d2750b751
            // imageSizeという名前の関数をPug内で使えるようにする
            imageSize: (src) => {
              // imgタグのsrc属性のパスを基にファイルパスを生成する
              const filePath = src.startsWith("/")
                ? path.resolve(sourcePath, src.slice(1)) // /から始まるルート相対パスの場合
                : path.resolve(file.dirname, src); // 相対パスの場合
              // ファイルパスに該当する画像のサイズをimage-sizeで取得する
              return imageSize(filePath);
            },
          };
        })
      )
      // 各ページで変わるパスなどを定義
      .pipe(
        $.data((file) => {
          const { basename } = file;
          const dirname = file.dirname.replace(/\\/g, "/");

          // 相対パス
          const relativePath =
            path.relative(dirname, config.src) === ""
              ? "."
              : path.relative(dirname, config.src);

          // srcからファイルがあるディレクトリまでのパス。先頭のスラッシュを削除
          const directoryName = dirname.replace(config.src, "").slice(1);

          // 拡張子なしのファイル名
          const fileName = basename.replace(`.pug`, "");

          // meta
          // _.getと同じ。
          const get = (obj, path, defaultValue = undefined) => {
            const travel = (regexp) =>
              String.prototype.split
                .call(path, regexp)
                .filter(Boolean)
                .reduce(
                  (res, key) =>
                    res !== null && res !== undefined ? res[key] : res,
                  obj
                );
            const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
            return result === undefined || result === obj
              ? defaultValue
              : result;
          };
          const filePathArray = directoryName
            ? [...directoryName.split("/"), fileName]
            : [fileName];
          const pageData = get(locals.data, filePathArray);

          // directoryNameが空の時はsrc直下なので、topページのパスにする
          const fileDirectoryPath = directoryName
            ? `${directoryName}/${fileName}`
            : fileName;

          // css
          const cssPath = `${relativePath}/css/object/project/${fileDirectoryPath}/style.css?${Date.now()}`;
          const jsPath = `${relativePath}/js/${fileDirectoryPath}/script.js?${Date.now()}`;

          // 画像
          // `${imgDirectoryPath}/img_${pageIdentifier}_kv_1.jpg` のように使う
          const imgDirectoryPath = `${relativePath}/img/${fileDirectoryPath}`;
          const movDirectoryPath = `${relativePath}/mov/${fileDirectoryPath}`;
          const pageIdentifier = directoryName
            ? `${directoryName.replace(/\//g, "_")}_${fileName}`
            : fileName;
          return {
            relativePath,
            pageData,
            cssPath,
            jsPath,
            imgDirectoryPath,
            movDirectoryPath,
            fileName,
            pageIdentifier,
          };
        })
      )
      .pipe(
        $.pug({
          // JSONファイルとルート相対パスの情報を渡します。
          locals: locals, // `/_includes/_layout`のようにルート相対パスで指定することができます。 // Pugファイルのルートディレクトリを指定します。
          basedir: config.src,
        })
      )
      .pipe($.cached("html-cache"))
      .pipe(gulp.dest(config.dist))
      .pipe(browserSync.reload({ stream: true }))
  ); // ブラウザリロードなし
};

exports.pug = pug;
