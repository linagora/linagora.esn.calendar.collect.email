const _ = require('lodash');
const RESOURCE_CUTYPE = 'resource';

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

    const eventAsJCAL = calendarModule.helpers.jcal.jcal2content(event.ics, '');
    let attendeesEmails = _.map(eventAsJCAL.attendees, (data, email) => {
      data.email = email;

      return data;
    })
    .filter(attendee => attendee.cutype !== RESOURCE_CUTYPE)
    .map(entry => entry.email);

    eventAsJCAL.organizer.email && attendeesEmails.push(eventAsJCAL.organizer.email);
    attendeesEmails = _.uniq(attendeesEmails);

    return contactCollector.handler.handle({userId: event.userId, emails: attendeesEmails});
  }
};
