'use strict';

const gulp = require('gulp');
const chalk = require('chalk');
const stylelint = require('stylelint');
const fs = require('fs');

module.exports.register = taskManager => {
  const src = taskManager.src;

  const glob = [`${src}/scss/**/*.scss`, `!${src}/scss/vendors/**/*.scss`];

  gulp.task('checkStyle', cb => {
    stylelint.lint({
      files: glob,
      formatter: 'string',
      syntax: 'scss'
    }).then(data => {
      if (data.output.length) {
        console.log(chalk.red(data.output));
      }
      fs.writeFile(`${src}/log/style-errors.log`, data.output, error => {
        if (error) { console.error(error); }
        cb();
      });
    }).catch(error => console.error(error));
  });

  gulp.task('stylelint', gulp.parallel('checkStyle', function watchStylelint(cb) {
    cb();
    gulp.watch(glob, gulp.parallel('checkStyle'));
  }));

  taskManager.registerTask('stylelint', 'development');
};

