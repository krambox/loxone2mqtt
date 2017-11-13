const winston = require('winston');

var Logger = function (config) {
  if (!config) {
    return new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({
          timestamp: true,
          colorize: true,
          level: 'debug'
        })
      ]
    });
  }

  var transports = [];

  config.forEach(function (item) {
    var transportClass = Object.keys(item)[0];
    transports.push(new (winston.transports[transportClass])(
      item[transportClass]
    ));
  });
  var logger = new (winston.Logger)({transports: transports});
  logger.exitOnError = false;

  return logger;
};

module.exports = Logger;
