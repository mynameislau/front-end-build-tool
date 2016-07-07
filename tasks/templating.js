'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const handlebars = require('gulp-compile-handlebars');
const browserSync = require('browser-sync');
const del = require('del');
const YAML = require('yamljs');
const fs = require('fs');
// const cache = require('gulp-cached');
// const Emitter = require('events');
const prettify = require('gulp-jsbeautifier');
const requireFromString = require('require-from-string');

const beautifyOptions = { indent_size: 2, preserve_newlines: true, max_preserve_newlines: 0 };

const templateDataPath = 'src/data/template-data.yaml';

let jsSourceOrder;

const templateDataFetched = () => new Promise((resolve, reject) => {
  fs.readFile(templateDataPath, (error, data) => {
    if (error) { console.error(error); }

    const templateData = YAML.parse(data.toString());

    if (jsSourceOrder) { templateData.jsSourceOrder = jsSourceOrder; }
    resolve(templateData);
  });
}).catch(reason => console.error(reason));

const helpersFetched = () => new Promise((resolve, reject) => {
  fs.readFile('src/templates/helpers/helpers.js', (error, data) => {
    if (error) { console.error(error); }

    const handlebarsOptions = {
      batch: ['src/templates/partials', 'src/templates/layouts'],
      helpers: requireFromString(data.toString())
    };
    resolve(handlebarsOptions);
  });
});

const init = ({ dev = 'dev', dist = 'dist', src = 'src', emitter = null }) => {
  const buildTemplates = isDist => new Promise((resolve, reject) => {
    const dir = isDist ? 'dist' : 'dev';

    del(`${dir}/*.html`).then(() =>
      helpersFetched().then(hbsOptions =>
        templateDataFetched().then(tplData => {
          const stream = gulp.src('src/templates/pages/*.hbs')
          .pipe(handlebars(tplData, hbsOptions))
          .on('error', error => {
            // console.error('templating error - ', error);
            process.stderr.write(`${error}\n`);
            stream.emit('end');
            reject(error);
          })
          .pipe(rename(path => {
            path.extname = '.html';
          }))
          .pipe(gulp.dest(`${dir}/`))
          .on('error', error => {
            console.error(error);
            stream.emit('end');
            reject(error);
          })
          .on('end', () => {
            resolve();
            browserSync.get(dir).reload();
            emitter.emit('pagesCreated');
          });
        })
        .catch(reason => console.error(reason))
        )
      .catch(reason => console.error(reason))
      )
    .catch(reason => console.error(reason));
  });

  buildTemplates.displayName = 'buildTemplates';


  gulp.task('buildTemplates', () => buildTemplates());
  gulp.task('buildTemplatesDist', () => buildTemplates(true));
  // gulp.task('setTemplateData', ['rebuildJS'], () =>
  // }));

  const watchTemplateFiles = cb => {
    gulp.watch('src/templates/**/*.hbs', gulp.series('buildTemplates'));
    gulp.watch(templateDataPath, gulp.series('buildTemplates'));

    return cb();
  };

  watchTemplateFiles.displayName = 'watchTemplateFiles';

  gulp.task('templating', gulp.parallel('buildTemplates', watchTemplateFiles));

  emitter.on('JSRebuilt', sourceOrder => {
    jsSourceOrder = sourceOrder;
    gulp.series('buildTemplates')();
  });
};

module.exports.register = taskManager => {
  const dev = taskManager.dev || 'dev';
  const dist = taskManager.dist || 'dist';
  const src = taskManager.src || 'src';
  // const emitter = new Events();

  init({ dev: dev, dist: dist, src: src, emitter: taskManager.emitter });

  taskManager.registerTask('templating', 'development');
  taskManager.registerTask('buildTemplatesDist', 'production');
};