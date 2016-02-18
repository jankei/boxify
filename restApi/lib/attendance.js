'use strict';

module.exports = {
  getAttendance           : getAttendance,
  getAttendanceForDay     : getAttendanceForDay,
  createAttendanceForSlot : createAttendanceForSlot,
  updateAttendance        : updateAttendance
};

var db        = require('./db');
var config    = require('./config');

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
    ExpressionAttributeNames: {
      '#date' : 'date',
      '#slotId' : 'slotId'
    },
    ExpressionAttributeValues: {
      ':hkey': selectedDate,
      ':skey': id
    }
  };
  return db.query(params, cb);
}

function getAttendanceForDay(selectedDate, cb) {
  var params = {
    TableName : config.tables.attendance,
    IndexName: 'date-slotId-index',
    KeyConditionExpression: '#date = :hkey',
    ExpressionAttributeNames: {
      '#date' : 'date'
    },
    ExpressionAttributeValues: {
      ':hkey': selectedDate
    }
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

