'use strict';

module.exports = {
  getUser : getUser
};

var db        = require('./db');
var config    = require('./config');

function getUser(id, cb) {
  var params = {
    TableName : config.tables.users,
    Key: { id: id }
  };
  return db.get(params, cb);
}

