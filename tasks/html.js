'use strict';

const gulp = require('gulp');
const del = require('del');
const browserSync = require('browser-sync');

module.exports.register = taskManager => {
  const dev = taskManager.dev;
  const dist = taskManager.dist;
  const src = taskManager.src;

  const copyHTML = gulp.task('copyHTML', cb => {
    gulp.src(`${src}/html/*.html`)
    .pipe(gulp.dest(`${dev}`))
    .on('end', cb)
    .pipe(browserSync.get('dev').stream());
  });

  gulp.task('html', gulp.parallel('copyHTML', cb => {
    cb();
    gulp.watch([`${src}/html/*.html`], gulp.series('copyHTML'));
  }));

  taskManager.registerTask('html', 'development');
};
