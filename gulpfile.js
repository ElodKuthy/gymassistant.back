var gulp = require("gulp");
var plugins = require("gulp-load-plugins")();

gulp.task("nodemon", function () {
    plugins.nodemon({ script: "server.js", ext: "js" });
});

gulp.task("deploy", function () {
    return gulp.src([
        "package.json",
        "server.js",
        "config.json",
        "api/**/*",
        "public/*",
        "routes/*",
        "ssl/*",
        "views/*"
    ], { "base" : "." })
        .pipe(gulp.dest("../gymassistant"));
});

gulp.task("default", ["deploy"]);
