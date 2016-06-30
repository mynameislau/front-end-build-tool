const gulp = require('gulp');

const argv = require('yargs').argv;
const basedir = argv.basedir;
const logGulp = require('./log-gulp');
const gulpfile = require('./gulpfile');

gulpfile.initAutoTasks(basedir).then(() => {
  const spawn = require('child_process').spawn;
  const ls = spawn('.\\node_modules\\.bin\\gulp.cmd', ['dev']);

  ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ls.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
  //gulp.series(argv.dist ? 'dist' : 'dev')();
});
