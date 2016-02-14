'use strict';

// Require Serverless ENV vars
var ServerlessHelpers = require('serverless-helpers-js').loadEnv();

// Require Logic
var lib = require('../../lib/schedule');

// Lambda Handler
module.exports.handler = function(event, context) {

  lib.update(event, function(error, response) {
    return context.done(error, response);
  });
};
