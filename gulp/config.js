import path from "path";
const root = path.resolve(__dirname + "/..").replace(/\\/g, "/");

module.exports = {
  root: root,
  src: root + "/src",
  pug: root + "/src/pug",
  img: root + "/src/img",
  movie: root + "/src/movie",
  scss: root + "/src/css",
  srcjs: root + "/src/js",
  dist: root + "/dist",
  css: root + "/dist/css",
  js: root + "/dist/js",
};
