'use strict';

module.exports = {
  create                    : create,
  read                      : read,
  readAttendee              : readAttendee,
  getAttendee               : getAttendee,
  getAttendees              : getAttendees,
  getAttendeeForDay         : getAttendeeForDay,
  reduceAttendeesListBySlot : reduceAttendeesListBySlot
};

var async           = require('async');
var _               = require('underscore');
var util            = require('./util');
var db              = require('./db');
var config          = require('./config');
var scheduleLib     = require('./schedule');
var attendanceLib   = require('./attendance');
var usersLib        = require('./users');

function create(event, cb) {
// check attendance table for remaining slots - throw and error if none available
  // on free slot increment and mark as full if this is last slot
  // create a new record for an attendee

  // collect data for creation
  var attendanceData = {
    slotId: event.slotId
  };

  // validate user
  var user;

  async.waterfall([
      function(waterfallCB) {
        usersLib.getUser(event.userId, waterfallCB);
      },

      function(result, waterfallCB) {
        util.log.info(result);
        user = result;
        scheduleLib.getScheduleById(event.slotId, waterfallCB);
      },

      function(result, waterfallCB) {
        util.log.info(result);
        attendanceData.slots = result.slots;
        attendanceData.date = event.date;
        attendanceLib.getAttendance(attendanceData.date, event.slotId, waterfallCB);
      },

      function(result, waterfallCB) {
        async.parallel({
            attendance: function(parallelCB) {
              util.log.info(result);
              if (_.isEmpty(result)) {
                attendanceData.id = util.uuid();
                attendanceData.taken = 0;
                attendanceData.full = false;
                attendanceData.createdAt = Date.now();
                attendanceLib.createAttendanceForSlot(attendanceData, parallelCB);
              } else {
                parallelCB(null, result[0]);
              }
            },
            attendee: function(parallelCB) {
              // check if already attending
              var attendee = {
                date: attendanceData.date,
                slotId: event.slotId,
                userId: event.userId
              };
              getAttendee(attendee, parallelCB);
            }
          },
          function(err, results) {
            util.log.info("Results : ", results);
            attendanceData = results.attendance;
            var attendee = results.attendee[0];
            if (_.isEmpty(attendee)) {
              // increment taken and check if full
              if (attendanceData.full) return cb("400:The Slot for this Training Session is Full");
              attendanceData.full = attendanceData.slots - attendanceData.taken <= 1;
              attendanceData.taken = attendanceData.full ? attendanceData.slots : attendanceData.taken+1;

              attendee = {
                date: attendanceData.date,
                userId: event.userId,
                slotId: event.slotId,
                name: user.name
              };
              util.log.info("attendance status just before creating an attendee : ", attendanceData);
              createAttendee(attendee, waterfallCB);
            } else {
              // throw error if wants to attend and full
              if (attendanceData.full && !attendee.attending) return cb("400:The Slot for this Training Session is Full");
              // decrement/increment taken
              attendanceData.taken += attendee.attending ? -1 : 1;
              // check if full
              attendanceData.full = attendanceData.taken === attendanceData.slots;
              // toggle attending
              attendee.attending = !attendee.attending;
              util.log.info("attendance status just before updating an attendee : ", attendanceData);
              updateAttendee(attendee, waterfallCB);
            }
          }
        );
      },

      function(result, waterfallCB) {
        util.log.info("attendance status : ", attendanceData);
        attendanceLib.updateAttendance(attendanceData, waterfallCB);
      }

    ],
    function(err) {
      return cb(err, attendanceData);
    }
  );
}

function readAttendee(event, cb) {
  if (event.userId) {
    var attendee = {
      date: event.date,
      userId: event.userId
    };
    getAttendeeForDay(attendee, cb);
  } else {
    readAttendees(event.date, cb);
  }
}

function readAttendees(date, cb) {
  async.waterfall([
      function(waterfallCB) {
        getAttendees(date, waterfallCB);
      },
      function(result, waterfallCB) {
        waterfallCB(null, reduceAttendeesListBySlot(result));
      }
    ],
    function(err, result) {
      return cb(err, result);
    });
}

function createAttendee(attendee, cb) {

  var newAttendee = {
    "id": util.uuid(),
    "date": attendee.date,
    "userId": attendee.userId,
    "slotId": attendee.slotId,
    "name": attendee.name,
    "attending": true,
    "createdAt": Date.now()
  };

  var params = {
    TableName : config.tables.attendees,
    Item: newAttendee
  };

  return db.put(params, cb, newAttendee);
}

function updateAttendee(attendee, cb) {
  var params = {
    TableName: config.tables.attendees,
    Key: {
      id: attendee.id
    },
    UpdateExpression: 'set #att = :t',
    ExpressionAttributeNames: {
      '#att' : 'attending'
    },
    ExpressionAttributeValues: {
      ':t' : attendee.attending
    },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params, cb);
}

function getAttendee(attendee, cb) {
  var params = {
    TableName : config.tables.attendees,
    IndexName: 'attendees-date-slotId-index',
    KeyConditionExpression: '#date = :hkey and #slotId = :skey',
    FilterExpression : '#userId = :ukey',
    ExpressionAttributeNames: {
      '#date' : 'date',
      '#slotId' : 'slotId',
      '#userId' : 'userId'
    },
    ExpressionAttributeValues: {
      ':hkey': attendee.date,
      ':skey': attendee.slotId,
      ':ukey': attendee.userId
    }
  };
  return db.query(params, cb);
}

function reduceAttendeesListBySlot(attendees) {
  var list = {};
  _.each(attendees, function(user) {
    if (user.attending) {
      list[user.slotId] = list[user.slotId] || [];
      list[user.slotId].push(user.name);
    }
  });
  return list;
}

function getAttendees(date, cb) {
  var params = {
    TableName : config.tables.attendees,
    IndexName: 'attendees-date-slotId-index',
    KeyConditionExpression: '#date = :hkey',
    ExpressionAttributeNames: {
      '#date' : 'date'
    },
    ExpressionAttributeValues: {
      ':hkey': date
    }
  };
  return db.query(params, cb);
}

function getAttendeeForDay(attendee, cb) {
  var params = {
    TableName : config.tables.attendees,
    IndexName: 'attendees-date-slotId-index',
    KeyConditionExpression: '#date = :hkey',
    FilterExpression : '#userId = :ukey',
    ExpressionAttributeNames: {
      '#date' : 'date',
      '#userId' : 'userId'
    },
    ExpressionAttributeValues: {
      ':hkey': attendee.date,
      ':ukey': attendee.userId
    }
  };
  return db.query(params, cb);
}

function read(event, cb) {
  var params = {
    TableName : config.tables.attendees,
    Key: { id: event.id }
  };
  return db.get(params, cb);
}
