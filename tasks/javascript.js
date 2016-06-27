'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync');
const sourcemaps = require('gulp-sourcemaps');
const fs = require('fs');
const path = require('path');
const del = require('del');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const YAML = require('yamljs');
// const Events = require('events');


module.exports.register = (taskManager) => {
  const dev = taskManager.dev;
  const dist = taskManager.dist;
  const src = taskManager.src;

  const jsSourceOrderPath = 'src/data/javascript_source_order.yaml';
  // const emitter = new Events();

  let sourceOrder;

  const isExternal = entry => entry.src.startsWith('http://') || entry.src.startsWith('https://') || entry.src.startsWith('//');

  const copyJSFiles = isDist => new Promise((resolveCopy) =>
  {
    const dir = isDist ? dist : dev;

    del(`${dir}/js/*`).then(() => {
      // all entries
      const entries = [];
      for (const name in sourceOrder) { entries.push(...sourceOrder[name]); }

      const localEntries = entries.filter(entry => !isExternal(entry));

      // copying local entries
      Promise.all(localEntries.map(entry => new Promise((resolve, reject) => {
        let stream;
        let dest;

        if (entry.bundle)
        {
          const gulpSRC = entry.bundle.map(currEntry => `${src}/${currEntry.src}`);
          stream = gulp.src(gulpSRC)
          .pipe(sourcemaps.init())
          .pipe(concat(entry.src));
          dest = dir;
        }
        else
        {
          stream = gulp.src(`${src}/${entry.src}`)
          .pipe(sourcemaps.init())
          .on('error', error => console.error(error));
          dest = path.dirname(`${dir}/${entry.src}`);
        }

        if (dist) { stream = stream.pipe(uglify()); }

        stream.pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(dest))
        .on('end', resolve)
        .on('error', error => {
          console.error(error);
          reject(error);
        });
      }))).then(resolveCopy);
    }).catch(error => console.error(error));
  });

  const getSourceOrder = data => {
    const source = {};
    const parsed = YAML.parse(data);
    for (const name in parsed)
    {
      source[name] = [];
      const srcGroup = source[name];
      let bundleNumber = 0;
      let bundling = false;
      for (let i = 0, length = parsed[name].length; i < length; i += 1)
      {
        const curr = parsed[name][i];
        // if current file is bundlable
        if (!isExternal(curr) && !curr.async && !curr.ie) {
          // if not yet created, create bundle
          if (!bundling) {
            bundling = true;
            bundleNumber += 1;
            srcGroup.push({ src: `js/bundles/${name}-bundle-${bundleNumber}.js`, bundle: [] });
          }
          // add file to bundle
          srcGroup[srcGroup.length - 1].bundle.push(Object.assign({}, curr));
        }
        // if not bundlable
        else
        {
          bundling = false;
          srcGroup.push(Object.assign({}, curr));
        }
      }
    }
    return source;
  };

  const createJSFilesArray = () => new Promise((resolve, reject) =>
  {
    fs.readFile(jsSourceOrderPath, (err, data) =>
    {
      if (!err) {
        try {
          sourceOrder = getSourceOrder(data.toString());
          resolve();
        }
        catch (error)
        {
          reject(error);
        }
      }
      else
      {
        reject(err);
      }
    });
  });

  gulp.task('createJSFilesArray', createJSFilesArray);

  gulp.task('compileJSDist', gulp.series('createJSFilesArray', function copyJSFilesTaskDist() { return copyJSFiles(true); }));

  const copyJSFilesTask = gulp.task('copyJSFiles', cb =>
  {
    copyJSFiles().then(() => {
      cb();
      // emitter.emit('JSFilesCopied');
      browserSync.get('dev').reload();
    });
  });

  const rebuildJSTask = gulp.task('rebuildJS', gulp.series('createJSFilesArray', function copyJSFilesAfterRebuild(cb) {
    copyJSFiles().then(() => {
      cb();
      // emitter.emit('JSRebuilt');
    });
  }));

  gulp.task('javascript', gulp.parallel('rebuildJS', function watchJavascript(cb) {
    cb();
    gulp.watch(jsSourceOrderPath, rebuildJSTask);
    gulp.watch(`${src}/js/**/*.*`, copyJSFilesTask);
  }));

  taskManager.registerTask('javascript', 'development');
  taskManager.registerTask('compileJSDist', 'production');
};
