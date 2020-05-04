'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const MODULE_NAME = 'linagora.esn.calendar.collect.email';

const calendarEmailCollectorModule = new AwesomeModule(MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.calendar', 'calendar'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.messaging', 'messaging'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact.collect', 'contact-collect')
  ],

  states: {
    lib: function(dependencies, callback) {
      const lib = require('./backend/lib')(dependencies);

      return callback(null, lib);
    },

    start: function(dependencies, callback) {
      this.listener.start();
      callback();
    }
  }
});

module.exports = calendarEmailCollectorModule;
