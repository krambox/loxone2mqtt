#!/usr/bin/env node

const loxMqttGateway = require('../lib/index.js');

if (!process.env.NODE_CONFIG_DIR) {
  process.env.NODE_CONFIG_DIR = __dirname + '/../config/';
}
var config = require('config');

var log = require('yalm');
log.setLevel('debug');

var app = new loxMqttGateway.App(log);
var mqttClient = loxMqttGateway.mqtt_builder(config.get('mqtt'), app);
var loxClient = loxMqttGateway.WebSocketAPI(config.get('miniserver'), app);
var loxMqttAdaptor;

app.on('exit', function (code) {
  if (loxMqttAdaptor) {
    loxMqttAdaptor.abort();
  }
});

function updateEvent (uuid, value) {
  if (loxMqttAdaptor) {
    loxMqttAdaptor.set_value_for_uuid(uuid, value);
  }
}

loxClient.on('update_event_text', updateEvent);
loxClient.on('update_event_value', updateEvent);

loxClient.on('get_structure_file', function (data) {
  if (loxMqttAdaptor) {
    loxMqttAdaptor.abort();
  }

  loxMqttAdaptor = new loxMqttGateway.Adaptor(loxMqttGateway.Structure.create_from_json(data,
    function (value) {
      log.warn('MQTT Structure - invalid type of control', value);
    }
  ));

  mqttClient.subscribe(loxMqttAdaptor.get_topic_for_subscription());

  loxMqttAdaptor.on('for_mqtt', function (topic, data) {
    log.debug('MQTT Adaptor - for mqtt: ', {topic: topic, data: data});
    mqttClient.publish(topic, data);
  });
});

mqttClient.on('connect', function (conack) {
  if (!loxClient.is_connected()) {
    loxClient.connect();
  }
});

mqttClient.on('message', function (topic, message, packet) {
  if (!loxMqttAdaptor) {
    return;
  }
  var action = loxMqttAdaptor.get_command_from_topic(topic, message.toString());

  app.log.debug('MQTT Adaptor - for miniserver: ', {uuidAction: action.uuidAction, command: action.command});

  if (!config.miniserver.readonly) {
    loxClient.send_cmd(action.uuidAction, action.command);
  } else {
    app.log.debug('MQTT Adaptor - readonly mode');
  }
});
