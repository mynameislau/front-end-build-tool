'use strict';

const gulp = require('gulp');
const del = require('del');
const browserSync = require('browser-sync');
// const vinylPaths = require('vinyl-paths');
// const changed = require('gulp-changed');

const dirs = ['assets', 'font', 'img', 'bower_components'];


module.exports.register = (taskManager) => {
  const dev = taskManager.dev;
  const dist = taskManager.dist;
  const src = taskManager.src;

  const copyAssets = isDist => {
    return new Promise((resolveCopy, rejectCopy) => {
      const dest = isDist ? dist : dev;

      del(dirs.map(directory => `${dest}/${directory}/*`)).then(() => {
        Promise.all(
          dirs.map(directory => new Promise((resolve, reject) => {
            gulp.src(`${src}/${directory}/**/*.*`)
            .pipe(gulp.dest(`${dest}/${directory}`))
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
  };

  // copying assets
  gulp.task('copyAssets', () => copyAssets());
  gulp.task('copyAssetsDist', () => copyAssets(true));

  gulp.task('assets', gulp.parallel('copyAssets', cb => {
    cb();
    gulp.watch(dirs.map(item => `${src}/${item}/**/*.*`), gulp.series('copyAssets'));
  }));

  taskManager.registerTask('assets', 'development');
  taskManager.registerTask('copyAssetsDist', 'production');
};

