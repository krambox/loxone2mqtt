var pkg = require('./package.json');
var config = require('yargs')
  .env('LOXONE')
  .usage(pkg.name + ' ' + pkg.version + '\n' + pkg.description + '\n\nUsage: $0 [options]')
  .describe('v', 'possible values: "error", "warn", "info", "debug"')
  .describe('n', 'instance name. used as mqtt client id and as prefix for connected topic')
  .describe('u', 'mqtt broker url. See https://github.com/mqttjs/MQTT.js#connect-using-a-url')
  .describe('p', 'Loxone passcode')
  .describe('l', 'Loxone host')
  .describe('i', 'Loxone user id')
  .describe('h', 'show help')
  .alias({
    'h': 'help',
    'n': 'name',
    'u': 'url',
    'i': 'userid',
    'l': 'loxone',
    'p': 'password',
    'v': 'verbosity'
  })
  .default({
    'u': 'mqtt://127.0.0.1',
    'n': 'lox',
    'v': 'info'
  })
  .version()
  .help('help')
  .argv;

module.exports = config;
