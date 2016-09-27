var fs = require('fs'),
	gulp = require('gulp'),
	ts = require('gulp-typescript'),
	concat = require('gulp-concat'),
	sourcemaps = require('gulp-sourcemaps'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	less = require('gulp-less'),
	autoprefixer = require('gulp-autoprefixer'),
	cssmin = require('gulp-cssmin'),
	wrapper = require('gulp-wrapper'),
    del = require('del'),
    debug = require('gulp-debug'),
    gulpif = require('gulp-if'),
    staticSiteGenerator = require('gulp-static-site-generator');

gulp.task('typescript', function() {

	var tsProject = ts.createProject('tsconfig.json', {sortOutput: true}),
		jsWrapper = fs.readFileSync("build/typescript/jquery-umd.js", 'utf8').split("/** {CODE} */");

	if(jsWrapper.length !== 2) throw new TypeError("Invalid wrapper template specified");

	return tsProject.src("src/index.ts")
		.pipe(debug({title: "[typescript]"}))
		.pipe(sourcemaps.init())
		.pipe(ts(tsProject))
		.pipe(concat("scrollert.js"))
		.pipe(wrapper({header: jsWrapper[0], footer: jsWrapper[1]}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("dist"))
		.pipe(uglify())
		.pipe(rename({ extname: '.min.js' }))
		.pipe(gulp.dest("dist"));
});

gulp.task('less', function() {

	return gulp.src("src/scrollert.less")
		.pipe(debug({title: "[less]"}))
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(autoprefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("dist"))
		.pipe(cssmin())
		.pipe(rename({ extname: '.min.css' }))
		.pipe(gulp.dest("dist"));
});

gulp.task('generate-docs', ['clean-docs'], function() {
    return gulp.src(['build/docs/site/**/*', "dist/*.min.*"])
		.pipe(debug({title: "[generate-docs]"}))
        .pipe(staticSiteGenerator({
            defaultLayout: 'base.jade',
            layoutPath: 'build/docs/layouts',
            jadeOptions: {
                pretty: true
            },
            prettyUrls: false
        }))
        .pipe(gulpif(/\.less$/, less()))
        .pipe(gulp.dest('docs'));
});

gulp.task('clean-docs', function(done) {
    del('./docs').then(function() {
        done();
    });
});

gulp.task('watch', function() {
	gulp.watch("src/*.ts", ['typescript']);
	gulp.watch("src/*.less", ['less']);
	gulp.watch(["build/docs/**/*", "dist/*.min.*"], ['generate-docs']);
});

gulp.task('build', ['typescript', 'less', 'generate-docs']);
gulp.task('default', ['watch', 'build']);
