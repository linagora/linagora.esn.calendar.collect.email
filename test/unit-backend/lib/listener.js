'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

describe('The listener lib module', function() {
  let email1, email2, orgEmail, jcal, userId, ics, event, EVENT_CREATED, EVENT_UPDATED;
  let getSpy, receiveSpy;

  beforeEach(function() {
    email1 = 'me@mail.com';
    email2 = 'you@mail.com';
    orgEmail = email1;
    userId = 1;
    ics = 2;
    EVENT_CREATED = 'event:add';
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

    receiveSpy = sinon.spy();
    getSpy = sinon.stub().returns({
      receive: receiveSpy
    });

    this.moduleHelpers.addDep('messaging', {
      pointToPoint: {
        get: getSpy
      }
    });
    this.requireModule = function() {
      return require('../../../backend/lib/listener')(this.moduleHelpers.dependencies);
    };
  });

  describe('The start function', function() {
    it('should receive to EVENT_ADDED local topic', function() {
      this.moduleHelpers.addDep('calendar', {
        constants: {
          EVENTS: {
            EVENT: {
              CREATED: EVENT_CREATED
            }
          }
        }
      });

      this.requireModule().start();
      expect(getSpy).to.have.been.calledTwice;
      expect(getSpy).to.have.been.calledWith(EVENT_CREATED);
      expect(receiveSpy).to.have.been.calledTwice;
    });

    it('should receive to EVENT_UPDATED global topic', function() {
      this.moduleHelpers.addDep('calendar', {
        constants: {
          EVENTS: {
            EVENT: {
              UPDATED: EVENT_UPDATED
            }
          }
        }
      });

      this.requireModule().start();
      expect(getSpy).to.have.been.calledTwice;
      expect(getSpy).to.have.been.calledWith(EVENT_UPDATED);
      expect(receiveSpy).to.have.been.calledTwice;
    });

    describe('On event', function() {
      it('should call the contact collector handler with valid email attendees', function(done) {
        let handler;
        const parseMessage = sinon.stub().returns({
          eventPath: {userId},
          event: jcal
        });
        const handleSpy = sinon.stub().returns(Promise.resolve());

        getSpy.withArgs(EVENT_CREATED).returns({
          receive: _handler => {
            handler = _handler;
          }
        });

        this.moduleHelpers.addDep('calendar', {
          constants: {
            EVENTS: {
              EVENT: {
                CREATED: EVENT_CREATED
              }
            }
          },
          helpers: {
            pubsub: {
              parseMessage
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
          expect(parseMessage).to.have.been.calledWith(event);
          expect(handleSpy).to.have.been.calledWith({userId, emails: [email1, email2]});
          done();
        }, done);
      });

      it('should keep the organizer email if not already in attendees', function(done) {
        let handler;
        const keepEmail = 'keepme@mail.com';
        const parseMessage = sinon.stub().returns({
          eventPath: {userId},
          event: jcal
        });
        const handleSpy = sinon.stub().returns(Promise.resolve());

        getSpy.withArgs(EVENT_CREATED).returns({
          receive: _handler => {
            handler = _handler;
          }
        });

        this.moduleHelpers.addDep('calendar', {
          constants: {
            EVENTS: {
              EVENT: {
                CREATED: EVENT_CREATED
              }
            }
          },
          helpers: {
            pubsub: {
              parseMessage
            }
          }
        });

        this.moduleHelpers.addDep('contact-collect', {
          handler: {
            handle: handleSpy
          }
        });

        jcal.organizer.email = keepEmail;
        this.requireModule().start();
        handler(event).then(() => {
          expect(parseMessage).to.have.been.calledOnce;
          expect(handleSpy).to.have.been.calledWith({userId, emails: [email1, email2, keepEmail]});
          done();
        }, done);
      });

      it('should not collect if event is imported', function(done) {
        let handler;
        const parseMessage = sinon.stub().returns({
          eventPath: {userId},
          event: jcal
        });
        const handleSpy = sinon.stub().returns(Promise.resolve());

        getSpy.withArgs(EVENT_CREATED).returns({
          receive: _handler => {
            handler = _handler;
          }
        });

        this.moduleHelpers.addDep('calendar', {
          constants: {
            EVENTS: {
              EVENT: {
                CREATED: EVENT_CREATED
              }
            }
          },
          helpers: {
            pubsub: {
              parseMessage
            }
          }
        });

        this.moduleHelpers.addDep('contact-collect', {
          handler: {
            handle: handleSpy
          }
        });

        this.requireModule().start();

        event.import = true;

        handler(event).then(imported => {
          expect(imported).to.be.false;
          expect(parseMessage).to.not.have.been.called;
          expect(handleSpy).to.not.have.been.called;
          done();
        }, done);
      });

      it('should not collect attendee with cutype=resource', function(done) {
        let handler;
        const resourceEmail = 'id@domain.com';

        jcal.attendees[resourceEmail] = { partstat: 'ACCEPTED', cn: undefined, cutype: 'resource' };

        const parseMessage = sinon.stub().returns({
          eventPath: {userId},
          event: jcal
        });
        const handleSpy = sinon.stub().returns(Promise.resolve());

        getSpy.withArgs(EVENT_CREATED).returns({
          receive: _handler => {
            handler = _handler;
          }
        });

        this.moduleHelpers.addDep('calendar', {
          constants: {
            EVENTS: {
              EVENT: {
                CREATED: EVENT_CREATED
              }
            }
          },
          helpers: {
            pubsub: {
              parseMessage
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
          expect(parseMessage).to.have.been.calledWith(event);
          expect(handleSpy).to.have.been.calledWith({userId, emails: [email1, email2]});
          done();
        }, done);
      });
    });
  });
});
