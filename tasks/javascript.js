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
// const EventEmitter = require('events');

const jsSourceOrderPath = 'src/data/javascript_source_order.yaml';
let sourceOrder = null;
const useBundlingInDev = false;

const getObjectEntries = obj =>
  Object.keys(obj).map(key =>
    [key, obj[key]]
  );

const getObjectValues = obj =>
  Object.keys(obj).map(key =>
    obj[key]
  );

const isExternal = entry =>
  entry.src.startsWith('http://')
  || entry.src.startsWith('https://')
  || entry.src.startsWith('//');

const isBundlable = entry =>
  !isExternal(entry) && !entry.async && !entry.ie && !entry.preventBundling;

const getSourceOrder = config => {
  const source = {};

  getObjectEntries(config).forEach(([groupName, groupEntries]) => {
    source[groupName] = [];
    const srcGroup = source[groupName];
    let bundleNumber = 0;
    let currentlyBundling = false;

    groupEntries.forEach(currentEntry => {
      if (useBundlingInDev && isBundlable(currentEntry)) {
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

  return source;
};

const init = ({ dev = 'dev', src = 'src', dist = 'dist', emitter = null }) => {
  const copyJSFiles = (sourceOrder, isDist) => new Promise(resolveCopy => {
    const dir = isDist ? dist : dev;

    del(`${dir}/js/*`).then(() => {
      const allEntries = [].concat(...getObjectValues(sourceOrder));
      const localEntries = allEntries.filter(entry => !isExternal(entry));

      // copying local entries
      Promise.all(localEntries.map(entry => new Promise((resolve, reject) => {
        const gulpSRC = entry.bundle ?
          entry.bundle.map(bundlePart => `${src}/${bundlePart.src}`)
          : `${src}/${entry.src}`;
        const dest = entry.bundle ? dir : path.dirname(`${dir}/${entry.src}`);

        const stream = gulp.src(gulpSRC)
        .pipe(sourcemaps.init())
        .on('error', error => console.error(error));

        const concatenated = entry.bundle ? stream.pipe(concat(entry.src)) : stream;
        const uglified = isDist ? concatenated.pipe(uglify()) : concatenated;

        uglified.pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(dest))
        .on('end', resolve)
        .pipe(browserSync.get(isDist ? 'dist' : 'dev').stream({ match: '**/*.js' }))
        .on('error', error => {
          console.error(error);
          reject(error);
        });
      })))
      .then(resolveCopy(sourceOrder));
    })
    .catch(error => console.error(error));
  });

  const getJSConfig = () => new Promise((resolve, reject) => {
    fs.readFile(jsSourceOrderPath, (err, data) => {
      if (err) {
        console.error(err);
      }

      try {
        resolve(YAML.parse(data.toString()));
      }
      catch (error)
      {
        reject(error);
      }
    });
  });

  createJSFilesArray.displayName = 'createJSFilesArray';

  const copyAndEmit = sourceOrder => {
    copyJSFiles().then(() => {
      if (emitter) { emitter.emit('JSRebuilt', sourceOrder); }

      return cb();
    });
  };

  copyAndEmit.displayName = 'copyAndEmit';

  const rebuildJS = getJSConfig()
  .then(config => getSourceOrder(config))
  .then(sourceOrder => copyJSFiles(sourceOrder))
  .then(sourceOrder)
  //  copyAndEmit().then(() =>//gulp.series(createJSFilesArray, copyAndEmit);

  rebuildJS.displayName = 'rebuildJS';

  gulp.task('copyJSFilesDist', () => copyJSFiles(true));
  gulp.task('copyJSFilesDev', () => copyJSFiles());

  const watchJSFiles = cb => {
    gulp.watch(jsSourceOrderPath, rebuildJS);
    gulp.watch(`${src}/js/**/*.*`, gulp.series('copyJSFilesDev'));

    return cb();
  };

  watchJSFiles.displayName = 'watchJSFiles';

  gulp.task('javascript', gulp.series(rebuildJS, watchJSFiles));

  gulp.task('compileJSDist', gulp.series(rebuildJS));
};

module.exports.register = taskManager => {
  const dev = taskManager.dev || 'dev';
  const dist = taskManager.dist || 'dist';
  const src = taskManager.src || 'src';
  // const emitter = new Events();

  init({ dev: dev, dist: dist, src: src, emitter: taskManager.emitter });

  taskManager.registerTask('javascript', 'development');
  taskManager.registerTask('compileJSDist', 'production');
};

  // todo ??
  // const reduceToBundleArray = (configGroupEntries, groupName) => {
  //   let bundleNumber = 0;
  //   let currentlyBundling = false;

  //   return configGroupEntries.reduce((bundleArray, currentEntry) => {
  //     if (isBundlable(currentEntry)) {
  //       // if not yet created, create bundle
  //       if (!currentlyBundling) {
  //         currentlyBundling = true;
  //         bundleNumber += 1;
  //         bundleArray.push({
  //           src: `js/bundles/${groupName}-bundle-${bundleNumber}.js`,
  //           bundle: []
  //         });
  //       }
  //       // add file to bundle
  //       bundleArray[bundleArray.length - 1].bundle.push(Object.assign({}, currentEntry));
  //     }
  //     // if not bundlable
  //     else
  //     {
  //       currentlyBundling = false;
  //       bundleArray.push(Object.assign({}, currentEntry));
  //     }

  //     return bundleArray;
  //   }, []);
  // };

  // const reduceToBundlesSet = config =>
  //   getObjectEntries(config).reduce((sourceObject, [groupName, groupEntries]) => {
  //     const bundleArray = reduceToBundleArray(groupEntries, groupName);
  //     const newObj = {};

  //     newObj[groupName] = bundleArray;

  //     return Object.assign(sourceObject, newObj);
  //   }, {});

  // const getSourceOrder = config =>
  //   reduceToBundlesSet(config);