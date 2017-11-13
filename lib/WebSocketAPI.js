const NodeLoxWsApi = require('node-lox-ws-api');

var WebSocketAPI = function (config, log) {
  var wsAuth = config.encrypted ? 'AES-256-CBC' : 'Hash';
  var client = new NodeLoxWsApi(config.host, config.username, config.password, true, wsAuth);

  client.on('connect', function () {
    log.info('WebSocketAPI - connect');
  });

  client.on('authorized', function () {
    log.info('WebSocketAPI - authorized');
  });

  client.on('connect_failed', function () {
    log.error('WebSocketAPI - connect failed');
  });

  client.on('connection_error', function (error) {
    log.error('WebSocketAPI - connection error: ' + error);
    System.exit(1);
  });

  client.on('close', function () {
    log.info('WebSocketAPI - close');
  });

  client.on('send', function (message) {
    log.debug('WebSocketAPI - send message: ' + message);
  });

  client.on('message_text', function (message) {
    var data = {
      type: message.type
    };
    switch (message.type) {
      case 'json':
        data.json = message.json;
        break;
      case 'control':
        data.control = message.control;
        data.value = message.value;
        data.code = message.code;
        break;
      default:
        data.text = message.data;
    }
    log.debug('WebSocketAPI - received text message: ', data);
  });

  client.on('message_file', function (message) {
    var data = {
      type: message.type,
      filename: message.filename
    };
    switch (message.type) {
      case 'json':
        data.json = JSON.stringify(message.data);
        break;
      case 'binary':
        data.length = message.data;
        break;
      default:
        data.text = message.data;
    }
    log.debug('WebSocketAPI - received file: ', data);
  });

  function updateEevent (uuid, evt) {
    var data = {
      uuid: uuid,
      'event': JSON.stringify(evt)
    };
    log.debug('WebSocketAPI - received update event: ', data);
  }

  client.on('update_event_value', updateEevent);
  client.on('update_event_text', updateEevent);
  client.on('update_event_daytimer', updateEevent);
  client.on('update_event_weather', updateEevent);

  client.on('message_invalid', function (message) {
    log.warn('WebSocketAPI - invalid message: ' + JSON.stringify(message));
  });

  client.on('keepalive', function (time) {
    log.debug('WebSocketAPI - keepalive (' + time + 'ms)');
  });

  client.on('message_header', function (header) {
    log.debug('WebSocketAPI - received message header (' + header.next_state() + '):', header);
  });

  client.on('message_event_table_values', function (messages) {
    log.debug('WebSocketAPI - received value messages:', messages.length);
  });

  client.on('message_event_table_text', function (messages) {
    log.debug('WebSocketAPI - received text messages:', messages.length);
  });

  client.on('get_structure_file', function (data) {
    log.debug('WebSocketAPI - get structure file ' + data.lastModified);
  });

  return client;
};

module.exports = WebSocketAPI;
