'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

describe('The listener lib module', function() {
  let email1, email2, orgEmail, jcal, userId, ics, event, EVENT_ADDED, EVENT_UPDATED;

  beforeEach(function() {
    email1 = 'me@mail.com';
    email2 = 'you@mail.com';
    orgEmail = email1;
    userId = 1;
    ics = 2;
    EVENT_ADDED = 'event:add';
    EVENT_UPDATED = 'event:updated';
    event = {userId, ics};
    jcal = {
      method: null,
      uid: 'f00c3f0e-81fe-4d4c-bcb2-47b1d0741c41',
      sequence: null,
      summary: 'eeee',
      location: null,
      description: null,
      start: {
        date: '08/24/2017',
        time: '10:30 AM',
        timezone: 'Europe/Berlin'
      },
      end: {
        date: '08/24/2017',
        time: '11:30 AM',
        timezone: 'Europe/Berlin'
      },
      allDay: false,
      attendees: {},
      organizer: {
        cn: 'John1 Doe1',
        email: orgEmail,
        avatar: '/api/avatars?objectType=user&email=user1@open-paas.org'
      },
      durationInDays: 0
    };

    jcal.attendees[email1] = { partstat: 'NEEDS-ACTION', cn: undefined };
    jcal.attendees[email2] = { partstat: 'ACCEPTED', cn: undefined };

    this.requireModule = function() {
      return require('../../../backend/lib/listener')(this.moduleHelpers.dependencies);
    };
  });

  describe('The start function', function() {
    it('should subscribe to EVENT_ADDED local topic', function() {
      const subscribeSpy = sinon.spy();
      const topicSpy = sinon.spy(function() {
        return {
          subscribe: subscribeSpy
        };
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('calendar', {
        constants: {
          NOTIFICATIONS: {
            EVENT_ADDED: EVENT_ADDED
          }
        }
      });

      this.requireModule().start();
      expect(topicSpy).to.have.been.calledTwice;
      expect(topicSpy).to.have.been.calledWith(EVENT_ADDED);
      expect(subscribeSpy).to.have.been.calledTwice;
    });

    it('should subscribe to EVENT_UPDATED local topic', function() {
      const subscribeSpy = sinon.spy();
      const topicSpy = sinon.spy(function() {
        return {
          subscribe: subscribeSpy
        };
      });

      this.moduleHelpers.addDep('pubsub', {
        local: {
          topic: topicSpy
        }
      });

      this.moduleHelpers.addDep('calendar', {
        constants: {
          NOTIFICATIONS: {
            EVENT_UPDATED: EVENT_UPDATED
          }
        }
      });

      this.requireModule().start();
      expect(topicSpy).to.have.been.calledTwice;
      expect(topicSpy).to.have.been.calledWith(EVENT_UPDATED);
      expect(subscribeSpy).to.have.been.calledTwice;
    });

    describe('On event', function() {
      it('should call the contact collector handler with valid email attendees', function(done) {
        let handler;
        const jcal2contentSpy = sinon.spy(function() {
          return jcal;
        });
        const handleSpy = sinon.spy(function() {
          return Promise.resolve();
        });
        const topicSpy = sinon.spy(function(topicName) {
          if (topicName === EVENT_ADDED) {
            return {
              subscribe: function(_handler) {
                handler = _handler;
              }
            };
          }

          return {
            subscribe: function() {}
          };
        });

        this.moduleHelpers.addDep('pubsub', {
          local: {
            topic: topicSpy
          }
        });

        this.moduleHelpers.addDep('calendar', {
          constants: {
            NOTIFICATIONS: {
              EVENT_ADDED: EVENT_ADDED
            }
          },
          helpers: {
            jcal: {
              jcal2content: jcal2contentSpy
            }
          }
        });

        this.moduleHelpers.addDep('contact-collect', {
          handler: {
            handle: handleSpy
          }
        });

        this.requireModule().start();
        handler(event).then(() => {
          expect(jcal2contentSpy).to.have.been.calledWith(ics, '');
          expect(handleSpy).to.have.been.calledWith({userId, emails: [email1, email2]});
          done();
        }, done);
      });
    });
  });
});
