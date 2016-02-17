'use strict';

// Require Serverless ENV vars
var ServerlessHelpers = require('serverless-helpers-js').loadEnv();

// Require Logic
var lib = require('../../lib/attendees');

// Lambda Handler
module.exports.handler = function(event, context) {

  //console.log(event, context);
  lib.read(event, function(error, response) {
    //console.log(error, response);
    if (error) return context.fail(error)
    else return context.done(error, response);
  });
};
