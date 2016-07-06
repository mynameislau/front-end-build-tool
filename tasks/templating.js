




/*****************************************************

            TODO -> passer la recuperation de data en promise

*****************************************************/









'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const handlebars = require('gulp-compile-handlebars');
const browserSync = require('browser-sync');
const del = require('del');
const YAML = require('yamljs');
const fs = require('fs');
const javascript = require('./javascript.js');
// const cache = require('gulp-cached');
// const Emitter = require('events');
var prettify = require('gulp-jsbeautifier');

const beautifyOptions = { indent_size: 2, preserve_newlines: true, max_preserve_newlines: 0 };

// const emitter = new Emitter();


const templateDataPath = 'src/data/template-data.yaml';

const handlebarsOptions = {
  batch: ['src/templates/partials', 'src/templates/layouts'],
  helpers: require('../src/templates/helpers/helpers.js')
};

let templateData;
let jsSourceOrder;

const init = ({ dev = 'dev', dist = 'dist', src = 'src', emitter = null }) => {
  const buildTemplates = isDist => new Promise((resolve, reject) =>
  {
    const dir = isDist ? 'dist' : 'dev';

    del(`${dir}/*.html`).then(() => whenTemplateData.then(() =>{
      const stream = gulp.src('src/templates/pages/*.hbs')
      .pipe(handlebars(templateData, handlebarsOptions))
      .on('error', error =>
      {
        //console.error('templating error - ', error);
        process.stderr.write(error + '\n');
        stream.emit('end');
        reject(error);
      })
      .pipe(rename(path => path.extname = '.html'))
      .pipe(gulp.dest(`${dir}/`))
      .on('error', error =>
      {
        console.error(error);
        stream.emit('end');
        reject(error);
      })
      .on('end', () => {
        resolve();
        browserSync.get(dir).reload();
        emitter.emit('pagesCreated');
      });
    }));
  });

  const whenTemplateData = new Promise((resolve, reject) => {
    fs.readFile(templateDataPath, (error, data) => {
      templateData = YAML.parse(data.toString());
      if (jsSourceOrder) { templateData.jsSourceOrder = jsSourceOrder; }
      resolve();
    });
  }).catch(reason => console.error(reason));

  gulp.task('setTemplateData', ['rebuildJS'], () =>
  }));

  gulp.task('templating', ['buildTemplates'], () => {
    gulp.watch('src/templates/**/*.hbs', ['buildTemplates']);
    gulp.watch(templateDataPath, ['buildTemplates']);
  });

  gulp.task('buildTemplates', () => buildTemplates());
  gulp.task('rebuildTemplates', () => buildTemplates());
  gulp.task('buildTemplatesDist', ['setTemplateData'], () => buildTemplates(true));

  emitter.on('JSRebuilt', sourceOrder => {
    jsSourceOrder = sourceOrder;
    gulp.series()
  })
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