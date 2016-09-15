var gulp = require('gulp'),
	ts = require('gulp-typescript'),
	concat = require('gulp-concat'),
	sourcemaps = require('gulp-sourcemaps'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	less = require('gulp-less'),
	autoprefixer = require('gulp-autoprefixer'),
	cssmin = require('gulp-cssmin');

gulp.task('typescript', function() {

	var tsProject = ts.createProject(__dirname + '/tsconfig.json', {sortOutput: true});

	return tsProject.src(__dirname + "/src/index.ts")
		.pipe(sourcemaps.init())
		.pipe(ts(tsProject))
		.pipe(concat("scrollert.js"))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(__dirname + "/dist"))
		.pipe(uglify())
		.pipe(rename({ extname: '.min.js' }))
		.pipe(gulp.dest(__dirname + "/dist"));

});

gulp.task('less', function() {

	return gulp.src(__dirname + "/src/scrollert.less")
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(autoprefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(__dirname + "/dist"))
		.pipe(cssmin())
		.pipe(rename({ extname: '.min.css' }))
		.pipe(gulp.dest(__dirname + "/dist"));
});

gulp.task('watch', function() {
	gulp.watch(__dirname + "/src/*.ts", ['typescript']);
	gulp.watch(__dirname + "/src/*.less", ['less']);
});

gulp.task('build', ['typescript', 'less']);
gulp.task('default', ['watch', 'build']);