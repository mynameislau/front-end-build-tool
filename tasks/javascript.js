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

const jsSourceOrderPath = 'src/data/javascript_source_order.yaml';
let sourceOrder = null;

module.exports.register = taskManager => {
  const dev = taskManager.dev;
  const dist = taskManager.dist;
  const src = taskManager.src;
  // const emitter = new Events();

  const isExternal = entry =>
    entry.src.startsWith('http://') || entry.src.startsWith('https://') || entry.src.startsWith('//');

  const isBundlable = entry =>
    !isExternal(entry) && !entry.async && !entry.ie;

  const copyJSFiles = isDist => new Promise((resolve, reject) =>
  {
    const dir = isDist ? 'dist' : 'dev';

    del(`${dir}/js/*`).then(() => {
      //all entries
      const entries = [];

      for (var name in sourceOrder) { entries.push(...sourceOrder[name]); }

      const localEntries = entries.filter(entry => !isExternal(entry));

      //copying local entries
      Promise.all(localEntries.map(entry => new Promise((resolve, reject) => {
        let stream;
        let dest;

        if (entry.bundle)
        {
          const gulpSRC = entry.bundle.map(entry => `src/${entry.src}`);
          stream = gulp.src(gulpSRC)
          .pipe(sourcemaps.init())
          .pipe(concat(entry.src));
          dest = dir;
        }
        else
        {
          stream = gulp.src(`src/${entry.src}`)
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
      }))).then(resolve);
    }).catch(error => console.error(error));
  });

  const getEntries = obj =>
    Object.keys(obj).map(key =>
      [key, obj[key]]
    );

  const getSourceOrder = parsed => {
    const src = {};

    getEntries(parsed).forEach(([groupName, groupEntries]) => {
      src[groupName] = [];
      const srcGroup = src[groupName];
      let bundleNumber = 0;
      let currentlyBundling = false;

      groupEntries.forEach(currentEntry => {
        if (isBundlable(currentEntry)) {
          // if not yet created, create bundle
          if (!currentlyBundling) {
            currentlyBundling = true;
            bundleNumber += 1;
            srcGroup.push({ src: `js/bundles/${groupName}-bundle-${bundleNumber}.js`, bundle: [] });
          }
          // add file to bundle
          srcGroup[srcGroup.length - 1].bundle.push(Object.assign({}, currentEntry));
        }
        // if not bundlable
        else
        {
          currentlyBundling = false;
          srcGroup.push(Object.assign({}, currentEntry));
        }
      });
    });

    return src;
  };

  const createJSFilesArray = () => new Promise((resolve, reject) => {
    fs.readFile(jsSourceOrderPath, (err, data) => {
      if (err) {
        console.error(err);
      }

      try {
        sourceOrder = getSourceOrder(YAML.parse(data.toString()));
        resolve();
      }
      catch (error)
      {
        reject(error);
      }
    });
  });

  gulp.task('createJSFilesArray', createJSFilesArray);

  gulp.task('copyJSFilesDist', () => copyJSFiles(true));

  gulp.task('compileJSDist', gulp.series('createJSFilesArray', 'copyJSFilesDist'));

  gulp.task('copyJSFiles', () => copyJSFiles());

  gulp.task('copyJSFilesAndReload', cb => {
    copyJSFiles().then(() => {
      // emitter.emit('JSFilesCopied');
      browserSync.get('dev').reload();

      return cb();
    });
  });

  gulp.task('rebuildJS', gulp.series('createJSFilesArray', cb => {
    copyJSFiles().then(() => {
      cb();
      // emitter.emit('JSRebuilt');
    });
  }));

  gulp.task('javascript', gulp.series('rebuildJS', () => {
    gulp.watch(jsSourceOrderPath, gulp.series('rebuildJS'));
    gulp.watch('src/js/**/*.*', gulp.series('copyJSFiles'));
  }));

  taskManager.registerTask('javascript', 'development');
  taskManager.registerTask('compileJSDist', 'production');
};

module.exports.sourceOrderPath = () => jsSourceOrderPath;
module.exports.getSourceOrder = () => sourceOrder;
