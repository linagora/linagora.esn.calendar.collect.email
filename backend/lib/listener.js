const CALENDAR_EVENTS = require('./constants').CALENDAR_EVENTS;

module.exports = dependencies => {
  const pubsub = dependencies('pubsub');
  const logger = dependencies('logger');
  const contactCollector = dependencies('contact-collect');

  return {
    start
  };

  function start() {
    pubsub.local.subscribe(CALENDAR_EVENTS.EVENT_ADDED, collect);
    pubsub.local.subscribe(CALENDAR_EVENTS.EVENT_UPDATED, collect);
  }

  function collect(event) {
    logger.debug('Collecting emails from Calendar event', event);

    const emailsToCollect = {userId: '', emails: []};

    contactCollector.collect(emailsToCollect)
      .then(result => {})
      .catch(err => {
      });
  }
};
