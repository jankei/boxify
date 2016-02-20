'use strict';

module.exports = {
  read            : read,
  getScheduleById : getScheduleById
};

var async         = require('async');
var _             = require('underscore');
var moment        = require('moment');
var util          = require('./util');
var db            = require('./db');
var config        = require('./config');
var attendanceLib = require('./attendance');
var attendeesLib  = require('./attendees');

function read(event, cb) {
  if (event.day === 'All') {
     getWeeklySchedule(cb);
  } else {
    var date = moment().day(event.day).format("DD.MM.YY");
    async.parallel({
        attendance: function(parallelCB) {
          attendanceLib.getAttendanceForDay(date, parallelCB);
        },
        attendees: function(parallelCB) {
          attendeesLib.getAttendees(date, parallelCB);
        },
        schedule: function(parallelCB) {
          getScheduleByDay(event.day, parallelCB);
        }
      },
      function(err, results) {
        var attendees = {};
        _.each(results.attendees, function(user) {
          attendees[user.slotId] = attendees[user.slotId] || [];
          attendees[user.slotId].push(user.name);
        });
        results.attendees = attendees;
        util.log.info("Results : ", results);
        return cb(err, results);
      }
    );
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
