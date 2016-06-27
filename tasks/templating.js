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
const Emitter = require('events');
var prettify = require('gulp-jsbeautifier');

const beautifyOptions = { indent_size: 2, preserve_newlines: true, max_preserve_newlines: 0 };

const emitter = new Emitter();

const templateDataPath = 'src/data/template-data.yaml';

const handlebarsOptions = {
  batch: ['src/templates/partials', 'src/templates/layouts'],
  helpers: require('../src/templates/helpers/helpers.js')
};

let templateData;

const buildTemplates = dist => new Promise((resolve, reject) =>
{
  const dir = dist ? 'dist' : 'dev';
  del(`${dir}/*.html`).then(() => {
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
  });
});

gulp.task('setTemplateData', ['rebuildJS'], () => new Promise((resolve, reject) =>
{
  fs.readFile(templateDataPath, (error, data) =>
  {
    templateData = YAML.parse(data.toString());
    templateData.jsSourceOrder = javascript.sourceOrder;
    resolve();
  });
}));

gulp.task('templating', ['buildTemplates'], () => {
  gulp.watch('src/templates/**/*.hbs', ['rebuildTemplates']);
  gulp.watch(templateDataPath, ['buildTemplates']);
  gulp.watch(javascript.sourceOrderPath, ['buildTemplates']);
});

gulp.task('buildTemplates', ['setTemplateData'], () => buildTemplates());
gulp.task('rebuildTemplates', () => buildTemplates());
gulp.task('buildTemplatesDist', ['setTemplateData'], () => buildTemplates(true));

module.exports = {
  emitter: emitter,
  autoTask: 'templating',
  distTask: 'buildTemplatesDist'
};
