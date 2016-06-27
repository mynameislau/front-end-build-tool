'use strict';

const gulp = require('gulp');
const del = require('del');
const browserSync = require('browser-sync');
// const vinylPaths = require('vinyl-paths');
// const changed = require('gulp-changed');

const dirs = ['assets'];

module.exports.register = taskManager => {
  const dev = taskManager.dev;
  const dist = taskManager.dist;
  const src = taskManager.src;

  function copyAssets(isDist) {
    return new Promise((resolveCopy, rejectCopy) => {
      const dir = isDist ? dist : dev;
      del(dirs.map(item => `${dir}/${item}/*`)).then(() =>
      {
        Promise.all(
          dirs.map(item => new Promise((resolve, reject) => {
            gulp.src(`${src}/${item}/**/*.*`)
            .pipe(gulp.dest(`${dir}/${item}`))
            .on('error', error => reject(error))
            .on('end', () => {
              resolve();
            });
          }))
        ).then(() => {
          resolveCopy();
          browserSync.get(isDist ? 'dist' : 'dev').reload();
        }).catch(reason => console.error(reason));
      }).catch(reason => {
        console.error(reason);
        rejectCopy(reason);
      });
    });
  }

  // copying assets
  gulp.task('copyAssets', () => copyAssets());
  gulp.task('copyAssetsDist', () => copyAssets(true));

  gulp.task('assets', gulp.parallel('copyAssets', function watchAssets(cb) {
    cb();
    gulp.watch(dirs.map(item => `${src}/${item}/**/*.*`), function watchCopyAssets() { return copyAssets(); });
  }));

  taskManager.registerTask('assets', 'development');
  taskManager.registerTask('copyAssetsDist', 'production');
};
