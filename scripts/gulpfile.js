const fs = require("fs");
const gulp = require("gulp");
const path = require("path");
const cleanCSS = require("gulp-clean-css");
const rename = require("gulp-rename");
const concat = require("gulp-concat");
const replace = require("gulp-replace");
const less = require("gulp-less");
const sass = require("gulp-sass");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");
const size = require("gulp-filesize");
const postcssPresetEnv = require("postcss-preset-env");
const postcss = require("gulp-postcss");

const { name } = require("../package.json");

const resolve = dir => path.join(__dirname, ".", dir);
const distDir = resolve("../dist");
const libDir = resolve("../lib");
const esDir = resolve("../es");
const lessDir = resolve("../components/**/*.less");
const indexJsDir = resolve("../components/**/style/index.js");

// 复制 less 文件到 lib es 文件夹下
gulp.task("copy-less", () => {
  return gulp
    .src(lessDir)
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(libDir))
    .pipe(gulp.dest(esDir));
});

// 根据 index.js 创建一个全新的 css.js 供按需加载 styel:'css' 使用
gulp.task("replace-indexjs", () => {
  return gulp
    .src(indexJsDir)
    .pipe(sourcemaps.init())
    .pipe(replace("less", "css"))
    .pipe(
      rename(function(path) {
        path.basename = "css";
        path.extname = ".js";
      })
    )
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(libDir))
    .pipe(gulp.dest(esDir));
});

// 编译 less 文件到 es 和 lib 文件夹下
gulp.task("compile-less", () => {
  return (
    gulp
      .src(lessDir)
      .pipe(sourcemaps.init())
      .pipe(
        less().on("error", function(err) {
          log.error(err.message);
        })
      )
      .pipe(
        postcss([
          // 编译.less 文件
          postcssPresetEnv({
            stage: 3,
            features: {
              "custom-properties": true,
              "nesting-rules": true
            },
            browsers: "last 2 versions"
          })
        ])
      )
      .pipe(
        rename(function(path) {
          path.extname = ".css";
        })
      )
      // 压缩 css 文件
      .pipe(cleanCSS({ inline: ["none"] }))
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest(libDir))
      .pipe(gulp.dest(esDir))
  );
});

// 编译 less 到 dist 文件夹下
gulp.task("dist-css", () => {
  return (
    gulp
      .src(lessDir)
      .pipe(sourcemaps.init())
      .pipe(
        less().on("error", function(err) {
          log.error(err.message);
        })
      )
      .pipe(
        postcss([
          postcssPresetEnv({
            stage: 3,
            features: {
              "custom-properties": true,
              "nesting-rules": true
            }
          })
        ])
      )

      .pipe(concat(`${name}.css`))
      .pipe(size())
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest(distDir))

      .pipe(concat(`${name}.min.css`))
      .pipe(size())
      // 压缩 css 文件
      .pipe(cleanCSS({ inline: ["none"] }))
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest(distDir))
  );
});

gulp.task("compile", gulp.series(gulp.parallel("copy-less", "replace-indexjs", "compile-less", "dist-css")));
