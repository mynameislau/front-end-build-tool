'use strict';

const gulp = require('gulp');
const webpack = require('webpack-stream');
const webpackConfig = require('../data/webpack.config.js');

module.exports.register = taskManager => {
  const dev = taskManager.dev;
  const dist = taskManager.dist;
  const src = taskManager.src;

  const pack = gulp.task('pack', cb =>
    gulp.src('src/entry.js')
      .pipe(webpack(webpackConfig))
      .pipe(gulp.dest('dist/'))
  );

  gulp.task('webpack', gulp.parallel('pack', cb => {
    cb();
    gulp.watch([`${src}/html/*.html`], gulp.series('pack'));
  }));

  taskManager.registerTask('html', 'development');
};
