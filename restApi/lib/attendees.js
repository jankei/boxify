'use strict';

module.exports = {
  create  : create,
  read    : read,
  update  : update,
  del     : del
};

var async     = require('async');
var _         = require('underscore');
var moment    = require('moment');
var util      = require('./util');
var db        = require('./db');
var config    = require('./config');
var schedule  = require('./schedule');

//async.parallel({
//    cachedRep: function(parallelCB) {
//      getCachedRep(parallelCB);
//    },
//    evaluations: function(parallelCB) {
//      getEvaluations(event.contributionId, parallelCB);
//    }
//  },
//  function(err, results) {
//    waterfallCB(err, results);
//  }
//);
function create(event, cb) {
// check attendance table for remaining slots - throw and error if none available
  // on free slot increment and mark as full if this is last slot
  // create a new record for an attendee

  // collect data for creation
  var attendanceData = {
    slotId: event.slotId
  };

  async.waterfall([

      function(waterfallCB) {
        schedule.getScheduleById(event.slotId, waterfallCB);
      },

      function(result, waterfallCB) {
        util.log.info(result);
        attendanceData.slots = result.slots;
        attendanceData.date = moment().day(result.day).format("DD.MM.YY");
        getAttendance(attendanceData.date, event.slotId, waterfallCB);
      },

      function(result, waterfallCB) {
        util.log.info(result);
        if (_.isEmpty(result)) {
          // create and "increment" taken by one
          attendanceData.id = util.uuid();
          attendanceData.taken = 1;
          attendanceData.full = false;
          attendanceData.createdAt = Date.now();
          createAttendanceForSlot(attendanceData, waterfallCB);
        } else {
          // increment taken and check if full
          // an array of one item
          var attendance = result[0];
          if (attendance.full) return cb("400:The Slot for this Training Session is Full");
          attendance.full = attendance.slots - attendance.taken <= 1;
          attendance.taken = attendance.full ? attendance.slots : attendance.taken+1;

          // this object will be the response
          attendanceData = attendance;

          util.log.info("attendance status : ", attendance);
          updateAttendance(attendance, waterfallCB);
        }
      },

      function(result, waterfallCB) {
        createAttendee(event, waterfallCB);
      }

    ],
    function(err) {
      return cb(err, attendanceData);
    }
  );
}

function updateAttendance(attendance, cb) {
  var params = {
    TableName: config.tables.attendance,
    Key: {
      id: attendance.id,
      date: attendance.date
    },
    UpdateExpression: 'set #tak = :t, #ful = :f',
    ExpressionAttributeNames: {
      '#ful' : 'full',
      '#tak' : 'taken'
    },
    ExpressionAttributeValues: {
      ':f' : attendance.full,
      ':t' : attendance.taken
    },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params, cb);
}

function getAttendance(selectedDate, id, cb) {
  var params = {
    TableName : config.tables.attendance,
    IndexName: 'date-slotId-index',
    KeyConditionExpression: '#date = :hkey and #slotId = :skey',
    ExpressionAttributeNames: { '#date' : 'date', '#slotId' : 'slotId' },
    ExpressionAttributeValues: { ':hkey': selectedDate, ':skey': id }
  };
  return db.query(params, cb);
}

function createAttendanceForSlot(data, cb) {
  var params = {
    TableName : config.tables.attendance,
    Item: data
  };

  return db.put(params, cb, data);
}

function createAttendee(event, cb) {

  var newAttendee = {
    "id": util.uuid(),
    "userId": event.userId,
    "slotId": event.slotId,
    "attending": true,
    "createdAt": Date.now()
  };

  var params = {
    TableName : config.tables.attendees,
    Item: newAttendee
  };

  return db.put(params, cb, newAttendee);
}

function read(event, cb) {
  var params = {
    TableName : config.tables.attendees,
    Key: { id: event.id }
  };
  return db.get(params, cb);
}

// do not externalise for this version
function del(event, cb) {

  var params = {
    TableName : config.tables.attendees,
    Key: { id: event.id },
    ReturnValues: 'ALL_OLD'
  };

  return db.del(params, cb);
}

function update(event, cb) {
// check attendee record if this is update for removing or adding the attendance back
// on adding - check attendance table for remaining slots - throw and error if none available
  // on free slot increment and mark as full if this is last slot
  // update the record for the attendee - attending = true
// on removing - decrement a free slot and change status of full if it was set to true
  // update the record for the attendee - attending = false

  var params = {
    TableName: config.tables.attendees,
    Key: {
      id: event.id
    },
    UpdateExpression: 'set #att = :t',
    ExpressionAttributeNames: {'#att' : 'attending'},
    ExpressionAttributeValues: {
      ':t' : event.attending
    },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params, cb);
}
