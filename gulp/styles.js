var gulp = require('gulp');
var gutil = require('gulp-util');
var	sass = require('gulp-sass');
var	autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var	minifyCss = require('gulp-minify-css');
var bytediff = require('gulp-bytediff');
var config = require('./config.js');
var plumber = require('gulp-plumber');

// gulp.task('styles', function() {
// 	return gulp.src('src/styles/*.scss')
// 		.pipe(sass())
// 		.pipe(autoprefixer('last 2 version'))
// 		.pipe(gulp.dest('client/css'))
// });

gulp.task('styles', function() {
    gutil.log('Bundling, minifying, and copying the app\'s CSS');

    return gulp.src(config.styles.src)
		.pipe(sass())
        .pipe(concat('app.min.css')) // Before bytediff or after
        .pipe(autoprefixer('last 2 version', '> 5%'))
        .pipe(bytediff.start())
        .pipe(minifyCss())
        .pipe(bytediff.stop(bytediffFormatter))
        //        .pipe(plug.concat('all.min.css')) // Before bytediff or after
        .pipe(gulp.dest(config.styles.dst));
});

gulp.task('vendor-styles', function() {
    gutil.log('Bundling, minifying, and copying the vendor CSS');

    return gulp.src(config.styles.vendors)
        .pipe(plumber())
        .pipe(concat('vendor.min.css')) // Before bytediff or after
        //        .pipe(plug.concat('all.min.css')) // Before bytediff or after
        .pipe(plumber.stop())
        .pipe(gulp.dest(config.styles.dst));
});

function bytediffFormatter(data) {
    var difference = (data.savings > 0) ? ' smaller.' : ' larger.';
    return data.fileName + ' went from ' +
        (data.startSize / 1000).toFixed(2) + ' kB to ' + (data.endSize / 1000).toFixed(2) + ' kB' +
        ' and is ' + formatPercent(1 - data.percent, 2) + '%' + difference;
};

function formatPercent(num, precision) {
    return (num * 100).toFixed(precision);
};
