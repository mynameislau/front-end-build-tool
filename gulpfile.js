'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync');
const requireFromString = require('require-from-string');
const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;

const taskManager = require('./tasks/taskManager');

// const config = YAML.parse(fs.readFileSync().toString());


// const tasks = config.tasks.map(task => {
//   const taskPath = path.basename(task) === task ? `./tasks/${task}.js` : `${path.join(basedir, task)}.js`;
//   return requireFromString(fs.readFileSync(taskPath).toString());
// });

const initAutoTasks = basedir => new Promise(resolveAutoTaskInitiated => {
  const taskManagerInst = taskManager.init(basedir);

  ////
  const configYAMLParsed = new Promise((resolve, reject) => {
    fs.readFile(path.join(basedir, '.buildtoolrc.yaml'), (err, rawConfigData) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(YAML.parse(rawConfigData.toString()));
      }
    });
  }).catch(reason => console.error(reason));

  const allTasksRequired = configYAMLParsed.then(config =>
    Promise.all(config.tasks.map(taskName => {
      if (config.devDirectory) { taskManagerInst.dev = config.devDirectory; }
      if (config.distDirectory) { taskManagerInst.dist = config.distDirectory; }

      const taskPath = path.basename(taskName) === taskName ? `./tasks/${taskName}.js` : `${path.join(basedir, taskName)}.js`;

      return new Promise((resolve, reject) => {
        fs.readFile(taskPath, (err, data) => {
          if (err) {
            reject(err);
          }
          else {
            resolve(requireFromString(data.toString()));
          }
        });
      });
    }))).catch(reason => console.error(reason));

  configYAMLParsed.then(config => allTasksRequired.then(requiredTasks => {
    // CHANGING DIRECTORY TO FILES DIRECTORY
    process.chdir(basedir);
    requiredTasks.forEach(task => task.register(taskManagerInst));

    browserSync.create('dist');
    browserSync.create('dev');

    const browserSyncDevConfig = {
      open: false
    };

    if (config.browserSyncProxy) {
      browserSyncDevConfig.proxy = config.browserSyncProxy;
    }
    else {
      browserSyncDevConfig.server = {
        baseDir: config.browserSyncProxy ? null : `./${taskManagerInst.dev}/`
      };
    }

    const buildPhase = gulp.parallel(...taskManagerInst.getTasks('development'));
    const postBuildPhase = gulp.parallel(...taskManagerInst.getTasks('development', 'postBuild'));

    gulp.task('dev', gulp.parallel(gulp.series(buildPhase, postBuildPhase), cb => {
      console.log(browserSyncDevConfig);
      browserSync.get('dev').init(browserSyncDevConfig);

      return cb();
    }));

    const buildPhaseProd = gulp.parallel(...taskManagerInst.getTasks('production', 'build'));
    const postBuildPhaseProd = gulp.parallel(...taskManagerInst.getTasks('production', 'postBuild'));

    gulp.task('dist', gulp.parallel(gulp.series(buildPhaseProd, postBuildPhaseProd), cb => {
      browserSync.get('dist').init({
        server:
        {
          baseDir: './dist/'
        },
        open: false
      });

      return cb();
    }));

    resolveAutoTaskInitiated();
  }).catch(error => console.error(error)));
}).catch(error => console.error(error));

gulp.task('default', cb => {
  initAutoTasks(argv.basedir).then(() => {
    gulp.series(argv.dist ? 'dist' : 'dev')();
    cb();
  });
});

module.exports.initAutoTasks = initAutoTasks;

////



// tasks.forEach(task => {
//   task.register(taskManager);
// });

// const browserSyncDevConfig = {
//   open: false
// };

// if (config.browserSyncProxy) {
//   browserSyncDevConfig.proxy = config.browserSyncProxy;
// }
// else {
//   browserSyncDevConfig.server = {
//     baseDir: config.browserSyncProxy ? null : `./${taskManager.dev}/`
//   };
// }

// const buildPhase = gulp.parallel(...taskManager.getTasks('development'));
// const postBuildPhase = gulp.parallel(...taskManager.getTasks('development', 'postBuild'));

// gulp.task('dev', gulp.parallel(gulp.series(buildPhase, postBuildPhase), cb => {
//   cb();
//   browserSync.get('dev').init(browserSyncDevConfig);
// }));

// const buildPhaseProd = gulp.parallel(...taskManager.getTasks('production', 'build'));
// const postBuildPhaseProd = gulp.parallel(...taskManager.getTasks('production', 'postBuild'));

// gulp.task('dist', gulp.parallel(gulp.series(buildPhaseProd, postBuildPhaseProd), cb => {
//   cb();
//   browserSync.get('dist').init({
//     server:
//     {
//       baseDir: './dist/'
//     },
//     open: false
//   });
// }));
