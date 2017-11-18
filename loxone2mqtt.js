#!/usr/bin/env node
const Adaptor = require('./lib/Adaptor.js');
const WebSocketAPI = require('./lib/WebSocketAPI.js');
const Structure = require('node-lox-structure-file');
var config = require('./config.js');
var Mqtt = require('mqtt');
var log = require('yalm');
log.setLevel(config.verbose);

var mqttConnected;
var loxClient = WebSocketAPI(config, log);
var loxMqttAdaptor;

var mqtt = Mqtt.connect(config.url, {will: {topic: config.name + '/connected', payload: '0', retain: true}});

mqtt.on('connect', function () {
  mqttConnected = true;

  log.info('mqtt connected', config.url);
  mqtt.publish(config.name + '/connected', '1', {retain: true});

  log.info('mqtt subscribe', config.name + '/set/#');
  mqtt.subscribe(config.name + '/set/#');

  if (!loxClient.is_connected()) {
    loxClient.connect();
  }
});

mqtt.on('close', function () {
  if (mqttConnected) {
    mqttConnected = false;
    log.info('mqtt closed ' + config.url);
  }
});

mqtt.on('error', function (err) {
  log.error('mqtt', err);
});

function updateEvent (uuid, value) {
  if (loxMqttAdaptor) {
    loxMqttAdaptor.setValueForUUID(uuid, value);
  }
}

loxClient.on('update_event_text', updateEvent);
loxClient.on('update_event_value', updateEvent);

loxClient.on('get_structure_file', function (data) {
  mqtt.publish(config.name + '/connected', '2', {retain: true});
  if (loxMqttAdaptor) {
    loxMqttAdaptor.abort();
  }

  loxMqttAdaptor = new Adaptor(Structure.create_from_json(data,
    function (value) {
      log.warn('MQTT Structure - invalid type of control', value);
    }
  ), log);

  mqtt.subscribe(config.name + '/set/#');

  loxMqttAdaptor.on('for_mqtt', function (topic, data) {
    log.debug('MQTT Adaptor - for mqtt: ', {topic: topic, data: data});
    mqtt.publish(config.name + '/state/' + topic, data);
  });
});

mqtt.on('message', function (topic, message, packet) {
  if (!loxMqttAdaptor) {
    return;
  }
  var action = loxMqttAdaptor.getCommandFromTopic(topic, message.toString());

  log.debug('MQTT Adaptor - for miniserver: ', {uuidAction: action.uuidAction, command: action.command});

  if (!config.miniserver.readonly) {
    loxClient.send_cmd(action.uuidAction, action.command);
  } else {
    log.debug('MQTT Adaptor - readonly mode');
  }
});
