const NodeLoxWsApi = require('node-lox-ws-api');

var WebSocketAPI = function (config, app) {
  var wsAuth = config.encrypted ? 'AES-256-CBC' : 'Hash';
  var client = new NodeLoxWsApi(config.host, config.username, config.password, true, wsAuth);

  app.on('exit', function (code) {
    client.abort();
  });

  client.on('connect', function () {
    app.log.info('WebSocketAPI - connect');
  });

  client.on('authorized', function () {
    app.log.info('WebSocketAPI - authorized');
  });

  client.on('connect_failed', function () {
    app.log.error('WebSocketAPI - connect failed');
  });

  client.on('connection_error', function (error) {
    app.log.error('WebSocketAPI - connection error: ' + error);
    app.exit(1);
  });

  client.on('close', function () {
    app.log.info('WebSocketAPI - close');
  });

  client.on('send', function (message) {
    app.log.debug('WebSocketAPI - send message: ' + message);
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
    app.log.debug('WebSocketAPI - received text message: ', data);
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
    app.log.debug('WebSocketAPI - received file: ', data);
  });

  function updateEevent (uuid, evt) {
    var data = {
      uuid: uuid,
      'event': JSON.stringify(evt)
    };
    app.log.debug('WebSocketAPI - received update event: ', data);
  }

  client.on('update_event_value', updateEevent);
  client.on('update_event_text', updateEevent);
  client.on('update_event_daytimer', updateEevent);
  client.on('update_event_weather', updateEevent);

  client.on('message_invalid', function (message) {
    app.log.warn('WebSocketAPI - invalid message: ' + JSON.stringify(message));
  });

  client.on('keepalive', function (time) {
    app.log.debug('WebSocketAPI - keepalive (' + time + 'ms)');
  });

  client.on('message_header', function (header) {
    app.log.debug('WebSocketAPI - received message header (' + header.next_state() + '):', header);
  });

  client.on('message_event_table_values', function (messages) {
    app.log.debug('WebSocketAPI - received value messages:', messages.length);
  });

  client.on('message_event_table_text', function (messages) {
    app.log.debug('WebSocketAPI - received text messages:', messages.length);
  });

  client.on('get_structure_file', function (data) {
    app.log.debug('WebSocketAPI - get structure file ' + data.lastModified);
  });

  return client;
};

module.exports = WebSocketAPI;
