"use strict";

import gulp from "gulp";
import browserSync from "browser-sync";

// browser-sync
const server = (done) => {
  browserSync({
    server: {
      baseDir: "dist",
    },
    startPath: `/`,
  });
  done();
};
exports.server = server;

// ブラウザリロード

const reload = (done) => {
  browserSync.reload({ stream: true });
  done();
};

exports.reload = reload;
