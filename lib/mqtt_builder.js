const mqtt = require('mqtt');

var mqttBuilder = function (config, app) {
  var client = mqtt.connect(config.host, config.options);

  app.on('exit', function (code) {
    client.end();
  });

  client.on('connect', function (connack) {
    app.log.info('MQTT - connect', connack);
  });

  client.on('reconnect', function () {
    app.log.debug('MQTT - reconnect');
  });

  client.on('close', function () {
    app.log.info('MQTT - close');
  });

  client.on('offline', function () {
    app.log.info('MQTT - offline');
  });

  client.on('error', function (error) {
    app.log.error('MQTT - error: ' + error);
    app.exit(1, error);
  });

  client.on('message', function (topic, message, packet) {
    app.log.debug('MQTT - message: ', {topic: topic, message: message, packet: packet});
  });

  return client;
};

module.exports = mqttBuilder;
