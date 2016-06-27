const gulp = require('gulp');
const jade = require('gulp-jade');
const inlineCSS = require('gulp-inline-css');
const sass = require('gulp-sass');
const browserSync = require('browser-sync');
const nodemailer = require('nodemailer');

module.exports.register = taskManager => {
  const dev = taskManager.dev;
  const src = taskManager.src;

  gulp.task('watchEmail', cb => {
    cb();
    gulp.watch([`${src}/**/*.jade`, `${src}/templates/**/*`], gulp.series('compileEmailJade'));
    gulp.watch([`${src}/**/*.scss`], gulp.series('compileEmailSass', 'compileEmailJade'));
  });

  gulp.task('compileEmailSass', cb => {
    const stream = gulp.src(`${src}/scss/*.scss`)
    .pipe(sass())
    .on('error', error => {
      console.error(error);
      stream.emit('end');
    })
    .pipe(gulp.dest(dev))
    .on('end', cb);
  });

  gulp.task('compileEmailJade', cb => {
    //console.dir(browserSync.get('dev'));
    //console.dir(browserSync.get('dev'));
    // browserSync.get('dev').emitter.on('init', () => {
    // console.log('////////////////////');
    //   console.log(browserSync.get('dev').instance.options.get('port'));
    // });
    const stream = gulp.src(`${src}/*.jade`)
    .pipe(jade({ pretty: true }))
    .on('error', error => {
      console.error(error);
      stream.emit('end');
    })
    .pipe(inlineCSS({
      url: `http://localhost:${browserSync.get('dev').instance.options.get('port')}`,
      applyStyleTags: false,
      removeStyleTags: false
    }))
    .on('error', error => {
      console.error('inline css error');
      stream.emit('end');
    })
    .pipe(gulp.dest(dev))
    .on('end', cb)
    .on('end', () => browserSync.get('dev').reload());
  });

  gulp.task('email', gulp.parallel('watchEmail', gulp.series('compileEmailSass', 'compileEmailJade')));

  taskManager.registerTask('email', 'development');

  // const sendMail = () => {

  //   // create reusable transporter object using the default SMTP transport
  //   var transporter = nodemailer.createTransport('smtp://webmail.groupe-scala.com:25');

  //   // setup e-mail data with unicode symbols
  //   var mailOptions = {
  //       from: '"Fred Foo 👥" <foo@blurdybloop.com>', // sender address
  //       to: 'bar@blurdybloop.com, l.falda@groupe-scala.com', // list of receivers
  //       subject: 'Hello ✔', // Subject line
  //       text: 'Hello world 🐴', // plaintext body
  //       html: '<b>Hello world 🐴</b>' // html body
  //   };

  //   // send mail with defined transport object
  //   transporter.sendMail(mailOptions, function(error, info){
  //       if(error){
  //           return console.log(error);
  //       }
  //       console.log('Message sent: ' + info.response);
  //   });
  // };

  // console.log(sendMail());
};
