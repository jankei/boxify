'use strict';

var logger = require('./logger');
var uuid   = require('node-uuid');
var _      = require('underscore');

var util = {
  uuid      : uuid.v4,
  log       : logger.log,
  pluckMany : pluckMany
};

module.exports = util;

function pluckMany() {
  var source = arguments[0];
  var propertiesToPluck = _.rest(arguments, 1);
  return _.map(source, function(item) {
    var obj = {};
    _.each(propertiesToPluck, function(property) {
      obj[property] = item[property];
    });
    return obj;
  });
}
