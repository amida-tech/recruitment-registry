'use strict';

const gulp = require('gulp');

const beautify = require('gulp-beautify');
const jshint = require('gulp-jshint');
const mocha = require('gulp-mocha');

const jsFiles = ['*.js', 'config/*.js', 'token/*.js', 'user/*.js', 'test/**/*.js'];

gulp.task('lint', function(done) {
    gulp.src(jsFiles, {
            base: './'
        })
        .pipe(beautify())
        .pipe(gulp.dest('./'))
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .on('end', function() {
            done();
        })
        .on('error', function(err) {
            done(err);
        });
});

gulp.task('test', function() {
    return gulp.src(['test/**/*.js'], {
            read: false
        })
        .pipe(mocha({
            reporter: 'spec'
        }))
        .on('error', () => {
            process.exit(1);
        })
        .once('end', () => {
            process.exit();
        })
});


gulp.task('default', function() {
    // place code for your default task here
});