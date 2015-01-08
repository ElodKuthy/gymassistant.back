var gulp = require("gulp");
var plugins = require("gulp-load-plugins")();
var config = require('./config.json');

gulp.task("nodemon", function () {
    plugins.nodemon({ script: "server.js", ext: "js" });
});

gulp.task("deploy", function () {
    return gulp.src([
        "node_modules/*",
        "package.json",
        "server.js",
        "config.json",
        "api/**/*",
        "public/*",
        "routes/*",
        "views/*"
    ], { "base" : "." })
        .pipe(gulp.dest(config.deploy.target));
});

gulp.task("default", ["deploy"]);
