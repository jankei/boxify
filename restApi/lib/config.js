'use strict';

var config = {
  tables: getTables()
};

module.exports = config;

function getTables() {
  return {
    schedule    : 'schedule',
    attendees   : 'attendees',
    attendance  : 'attendance',
    users       : 'users',
    wod         : 'wod'
  };
}
