'use strict';

const sourcemaps = require('gulp-sourcemaps');
const gulp = require('gulp');
const sass = require('gulp-sass');
const beep = require('beepbeep');
const del = require('del');
const browserSync = require('browser-sync');
const cleanCSS = require('gulp-clean-css');

module.exports.register = (taskManager) => {
  const dev = taskManager.dev;
  const dist = taskManager.dist;
  const src = taskManager.src;

  const compileSass = (cb, isDist) => {

    console.log(dev);
    const dest = isDist ? `${dist}/css` : `${dev}/css`;

    del(dest).then(() =>
    {
      const glob = [`${src}/scss/*.scss`, `!${src}/scss/_*.scss`];

      let stream = gulp.src(glob)
      .pipe(sourcemaps.init())
      .pipe(sass({ outputStyle: 'expanded' }))
      .on('error', error => {
        sass.logError.call(stream, error);
        beep(4);
      });

      if (isDist) {
        stream = stream.pipe(cleanCSS())
        .pipe(sourcemaps.write('./'));
      }
      else {
        stream = stream.pipe(sourcemaps.write('./'));
      }

      stream.pipe(gulp.dest(dest))
      .on('end', cb)
      .pipe(browserSync.get(isDist ? 'dist' : 'dev').stream({ match: '**/*.css' }));
    }).catch(error => console.error('compile sass error: ', error));
  };

  gulp.task('compileSassDist', cb => {
    compileSass(cb, true);
  });

  gulp.task('compileSass', cb => {
    compileSass(cb);
  });

  gulp.task('css', gulp.parallel('compileSass', function watchCSS(cb) {
    cb();
    gulp.watch([`${src}/scss/**/*.scss`], gulp.series('compileSass'));
  }));

  taskManager.registerTask('css', 'development');
  taskManager.registerTask('compileSassDist', 'production');
};