module.exports = {
  init: () => {
    const taskManager = Object.create({
      tasks: [],
      dev: 'dev',
      dist: 'dist',
      src: 'src',
      registerTask: (taskName, environment = 'development', phase = 'default') => {
        taskManager.tasks.push({
          taskName: taskName,
          environment: environment,
          phase: phase
        });
      },
      getTasks: (environment = 'development', phase = 'default') =>
        taskManager.tasks.filter(task =>
          task.environment === environment && task.phase === phase
        )
        .map(task => task.taskName)
    });
    return taskManager;
  }
};

