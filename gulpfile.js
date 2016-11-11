var gulp = require('gulp');
var rename = require('gulp-rename');
var jquerify = require('jquerify');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var stringify = require('stringify');

gulp.task("js",function(){
    browserify('./src/spread.js')
    .transform(stringify([".html",".css"]))
    .bundle()
    .pipe(source('spread.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./'))
    .pipe(uglify())
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest('./'))
});

gulp.task("default",function(){
    gulp.watch('./src/**/**',["js"]);
});