'use strict';

module.exports = {
  getUser : getUser,
  read    : read
};

var async     = require('async');
var db        = require('./db');
var config    = require('./config');
var util      = require('./util');

function getUser(id, cb) {
  var params = {
    TableName : config.tables.users,
    Key: { id: id }
  };
  return db.get(params, cb);
}

function getAllUsers(cb) {
  var params = {
    TableName : config.tables.users,
    ConsistentRead: true,
    ReturnConsumedCapacity: "TOTAL"
  };
  return db.scan(params, cb);
}

function read(event, cb) {
  async.waterfall([
      function(waterfallCB) {
        getAllUsers(waterfallCB);
      },
      function(result, waterfallCB) {
        waterfallCB(null, util.pluckMany(result, 'id', 'name'));
      }
    ],
    function(err, result) {
      return cb(err, result);
    });
}
