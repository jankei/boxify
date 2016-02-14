'use strict';

var logger = require('./logger');
var uuid   = require('node-uuid');

var util = {
  uuid  : uuid.v4,
  log   : logger.log
};

module.exports = util;
