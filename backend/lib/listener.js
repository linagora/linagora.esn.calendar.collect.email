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
    pubsub.global.topic(calendarModule.constants.EVENTS.EVENT.CREATED).subscribe(collect);
    pubsub.global.topic(calendarModule.constants.EVENTS.EVENT.UPDATED).subscribe(collect);
  }

  function collect(msg) {
    logger.info('Collecting emails from Calendar event', msg);

    const { event, eventPath } = calendarModule.helpers.pubsub.parseMessage(msg);
    let emails = _.map(event.attendees, (data, email) => {
      data.email = email;

      return data;
    })
    .filter(attendee => attendee.cutype !== RESOURCE_CUTYPE)
    .map(entry => entry.email);

    event.organizer.email && emails.push(event.organizer.email);
    emails = _.uniq(emails);

    return contactCollector.handler.handle({userId: eventPath.userId, emails});
  }
};
