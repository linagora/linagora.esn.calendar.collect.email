const _ = require('lodash');

module.exports = dependencies => {
  const pubsub = dependencies('pubsub');
  const logger = dependencies('logger');
  const contactCollector = dependencies('contact-collect');
  const calendarModule = dependencies('calendar');

  return {
    start
  };

  function start() {
    pubsub.local.topic(calendarModule.constants.NOTIFICATIONS.EVENT_ADDED).subscribe(collect);
    pubsub.local.topic(calendarModule.constants.NOTIFICATIONS.EVENT_UPDATED).subscribe(collect);
  }

  function collect(event) {
    logger.info('Collecting emails from Calendar event', event);

    const emailsToCollect = {userId: event.userId, emails: getAttendeesEmailsFromICS(event.ics)};

    return contactCollector.handler.handle(emailsToCollect)
      .then(() => logger.info('Calendar event emails have been collected'))
      .catch(err => logger.error('Error while collecting calendar event emails', err));
  }

  function getAttendeesEmailsFromICS(ics) {
    const jcal = calendarModule.helpers.jcal.jcal2content(ics, '');

    return _.map(jcal.attendees, (data, email) => (email));
  }
};
