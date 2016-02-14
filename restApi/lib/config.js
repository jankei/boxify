'use strict';

var config = {
  tables: getTables()
};

module.exports = config;

function getTables() {
  return {
    schedule  : 'schedule',
    attendees : 'attendees',
    users     : 'users',
    wod       : 'wod'
  };
}
