var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'boxify'});
var logger = {
  log: log
};

module.exports = logger;
