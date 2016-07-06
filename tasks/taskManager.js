const EventEmitter = require('events');

module.exports = {
  init: () => {
    const taskManager = Object.create({
      tasks: [],
      dev: 'dev',
      dist: 'dist',
      src: 'src',
      emitter: new EventEmitter(),
      registerTask: (taskName, environment = 'development', phase = 'build') => {
        taskManager.tasks.push({
          taskName: taskName,
          environment: environment,
          phase: phase
        });
      },
      getTasks: (environment = 'development', phase = 'build') =>
        taskManager.tasks.filter(task =>
          task.environment === environment && task.phase === phase
        )
        .map(task => task.taskName)
    });
    return taskManager;
  }
};

