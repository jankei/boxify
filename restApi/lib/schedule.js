'use strict';

module.exports = {
  create  : create,
  read    : read,
  update  : update,
  del     : del
};

var util    = require('./util');
var db      = require('./db');
var config  = require('./config');

function create(event, cb) {

  var newAttendee = {
    "id": util.uuid(),
    "userId": event.userId,
    "slotId": event.slotId,
    "attending": event.attending,
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
    TableName : config.tables.schedule,
    Key: { id: event.id }
  };

  return db.get(params, cb);
}

function del(event, cb) {

  var params = {
    TableName : config.tables.attendees,
    Key: { id: event.id },
    ReturnValues: 'ALL_OLD'
  };

  return db.del(params, cb);
}

function update(event, cb) {

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
