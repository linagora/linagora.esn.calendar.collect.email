const _ = require('lodash');
const RESOURCE_CUTYPE = 'resource';

module.exports = dependencies => {
  const logger = dependencies('logger');
  const pointToPointMessaging = dependencies('messaging').pointToPoint;
  const contactCollector = dependencies('contact-collect');
  const calendarModule = dependencies('calendar');

  return {
    start
  };

  function start() {
    pointToPointMessaging.get(calendarModule.constants.EVENTS.EVENT.CREATED).receive(collect);
    pointToPointMessaging.get(calendarModule.constants.EVENTS.EVENT.UPDATED).receive(collect);
  }

  function collect(msg) {
    logger.info('Collecting emails from Calendar event', msg);

    if (msg.import) {
      logger.debug('Event is from import, skipping collector');

      return Promise.resolve(false);
    }

    const { event, eventPath } = calendarModule.helpers.pubsub.parseMessage(msg);
    let emails = _.map(event.attendees, (data, email) => {
      data.email = email;

      return data;
    })
    .filter(attendee => attendee.cutype !== RESOURCE_CUTYPE)
    .map(entry => entry.email);

    event.organizer && event.organizer.email && emails.push(event.organizer.email);
    emails = _.uniq(emails);

    return contactCollector.handler.handle({userId: eventPath.userId, emails});
  }
};
