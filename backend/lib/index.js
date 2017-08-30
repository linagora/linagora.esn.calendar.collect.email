'use strict';

module.exports = dependencies => {
  const listener = require('./listener')(dependencies);

  return {
    listener
  };
};
