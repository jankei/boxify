'use strict';

// Require Serverless ENV vars
var ServerlessHelpers = require('serverless-helpers-js').loadEnv();

// Require Logic
var lib = require('../../lib/schedule');

// Lambda Handler
module.exports.handler = function(event, context) {

  lib.create(event, function(error, response) {
    if (error) return context.fail(error, response);
    else return context.done(error, response);
  });
};
