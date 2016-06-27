'use strict';

const argv = require('yargs').argv;
const gulp = require('gulp');
const browserSync = require('browser-sync');
const requireFromString = require('require-from-string');

const basedir = argv.basedir;
const YAML = require('yamljs');
const taskManager = require('./tasks/taskManager').init(basedir);
const fs = require('fs');
const path = require('path');

const buildToolDirectory = __dirname;

browserSync.create('dist');
browserSync.create('dev');

const config = YAML.parse(fs.readFileSync(path.join(basedir, '.buildtoolrc.yaml')).toString());

if (config.devDirectory) { taskManager.dev = config.devDirectory; }
if (config.distDirectory) { taskManager.dist = config.distDirectory; }

const tasks = [];
config.tasks.forEach(task => {
  const taskPath = path.basename(task) === task ? `./tasks/${task}.js` : `${path.join(basedir, task)}.js`;
  tasks.push(requireFromString(fs.readFileSync(taskPath).toString()));
});

// CHANGING DIRECTORY TO FILES DIRECTORY
process.chdir(basedir);

tasks.forEach(task => {
  task.register(taskManager);
});

const browserSyncDevConfig = {
  open: false
};

if (config.browserSyncProxy) {
  browserSyncDevConfig.proxy = config.browserSyncProxy;
}
else {
  browserSyncDevConfig.server = {
    baseDir: config.browserSyncProxy ? null : `./${taskManager.dev}/`
  };
}

const buildPhase = gulp.parallel(...taskManager.getTasks());
const postBuildPhase = gulp.parallel(...taskManager.getTasks('development', 'postBuild'));

gulp.task('default', gulp.parallel(gulp.series(buildPhase, postBuildPhase), function startBrowserSync(cb) {
  cb();
  browserSync.get('dev').init(browserSyncDevConfig);
}));

gulp.task('dist', () => {
  browserSync.get('dist').init({
    server:
    {
      baseDir: './dist/'
    },
    open: false
  });
});
