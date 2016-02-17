'use strict';

module.exports = {
  read            : read,
  getScheduleById : getScheduleById
};

var util    = require('./util');
var db      = require('./db');
var config  = require('./config');

function read(event, cb) {
  if (event.day === 'All') {
     getWeeklySchedule(cb);
  } else {
     getScheduleByDay(event.day, cb);
  }
}

function getWeeklySchedule(cb) {
  var params = {
    TableName : config.tables.schedule,
    ConsistentRead: true,
    ReturnConsumedCapacity: "TOTAL"
  };
  return db.scan(params, cb);
}

function getScheduleByDay(selectedDay, cb) {
  var params = {
    TableName : config.tables.schedule,
    IndexName: 'day-index',
    KeyConditionExpression: '#day = :hkey',
    ExpressionAttributeNames: { '#day' : 'day' },
    ExpressionAttributeValues: { ':hkey': selectedDay }
  };
  return db.query(params, cb);
}

function getScheduleById(id, cb) {
  var params = {
    TableName : config.tables.schedule,
    Key: { id: id }
  };
  return db.get(params, cb);
}
