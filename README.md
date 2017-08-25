# linagora.esn.calendar.collect.email

This module listen to OpenPaaS Events published from linagora.esn.calendar module and collect the attendees emails using linagora.esn.contact.collect module.

## Installation

This module can be installed in OpenPaaS as other modules. Check the [documentation](http://docs.open-paas.org/) for more details.

## Technical considerations

Once a calendar event is created or updated, a message is published on the OpenPaaS platform local pubsub component. The current component subscribes to the pubsub, extracts attendees from the ICS data and then call the contact collector API.
