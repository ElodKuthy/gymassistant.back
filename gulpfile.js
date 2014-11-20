var gulp = require("gulp");
var plugins = require("gulp-load-plugins")();

gulp.task("nodemon", function () {
    plugins.nodemon({ script: "server.js", ext: "js" });
});

gulp.task("deploy", function () {
    return gulp.src([
        "package.json",
        "server.js",
        "api/**/*",
        "public/*",
        "routes/*",
        "ssl/*"
    ], { "base" : "." })
        .pipe(gulp.dest("../gymassistant"));
});

gulp.task("default", ["nodemon"]);
