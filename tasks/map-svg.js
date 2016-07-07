const gulp = require('gulp');
const svgMapper = require('svg-symbols-map');


module.exports.register = (taskManager) => {
  const dev = taskManager.dev;
  // const dist = taskManager.dist;
  const src = taskManager.src;

  gulp.task('mapSVG', () => svgMapper.map(`${src}/svg-map/*.svg`, `${dev}/svg-map/map.svg`));
  gulp.task('svg-mapping', gulp.parallel('mapSVG', function watchSVGMap (cb) {
    gulp.watch(`${src}/svg-map/*.svg`, ['mapSVG']);
    gulp.watch(`${dev}/svg-map/*`, ['mapSVG']);

    return cb();
  }));

  taskManager.registerTask('mapSVG', 'development');
  taskManager.registerTask('mapSVG', 'production');
};
