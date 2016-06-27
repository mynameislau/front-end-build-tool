const gulp = require('gulp');
const Parker = require('parker/lib/Parker');
const metrics = require('parker/metrics/All'); // Or an array of the metrics you want to measure
const fs = require('fs');


module.exports.register = (taskManager) => {
  console.log('resgistent parker');
  const dev = taskManager.dev;

  gulp.task('parker', cb => {
    console.log('okkkk');
    fs.readFile(`${dev}/css/main.css`, (err, data) => {
      if (err) {
        console.error(err);
      }

      const parker = new Parker(metrics);
      const results = parker.run(data.toString());

      console.log(results);
      cb();

      // Do something with results
    });
  });

  taskManager.registerTask('parker', 'development', 'postBuild');
};
