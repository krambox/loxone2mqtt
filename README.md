# loxone2mqtt

[![NPM version](https://badge.fury.io/js/loxone2mqtt.svg)](http://badge.fury.io/js/loxone2mqtt)
[![Dependency Status](https://img.shields.io/gemnasium/krambox/loxone2mqtt.svg?maxAge=2592000)](https://gemnasium.com/github.com/krambox/loxone2mqtt)
[![Build Status](https://travis-ci.org/krambox/buderus2mqtt.svg?branch=master)](https://travis-ci.org/krambox/loxone2mqtt)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Gateway for Loxone™ miniserver to communicate with mqtt broker with the  https://github.com/mqtt-smarthome topic and payload format.

This is a fork of [node-lox-mqtt-gateway](https://github.com/alladdin/node-lox-mqtt-gateway) (c) 2016 Ladislav Dokulil , heavily modified and rewritten to suite my needs.

Notable changes:
- https://github.com/mqtt-smarthome topic and payload format 
- based on xyz2mqtt with yalm for logging and yargs (in progress)
- teduced and simplified code (in progress)
- https://github.com/mqtt-smarthome topic and payload format 


For communication with miniserver is used WebSocket api described in [Loxone™ API Documentation]
(https://www.loxone.com/enen/kb/api/)

## Preamble

This is experimental version.

Use it at your own risk.

## Quick start

`sudo npm install -g loxone2mqtt`

`lox-mqtt-gateway --NODE_CONFIG='{"mqtt":{"host":"mqtt://localhost:1883","options":{"username":"XXX","password":"YYY"}},"miniserver":{"host":"192.168.0.77:80","username":"XXX","password":"YYY"}}'`

## MQTT Interface

### MQTT topic base

`mqtt_prefix/{state|set}/category/room/control_name/`

**example**

`lox/state/light/bedroom/main_light`

### States of Loxone™ miniserver to MQTT

If you tries to get the state of specific control you need to subscribe

#### topic

`mqtt_prefix/{state|set}/category/room/control_name/`

#### message contains data

in **JSON** format.

**TODO:** Make documentation for all controls

### MQTT to Loxone™ miniserver actions

If you could make some action you must publish message with:

#### topic

`mqtt_prefix/set/category/room/control_name/`

#### data

There is a command string like in [Loxone™ API Structure file documentation](https://www.loxone.com/dede/wp-content/uploads/sites/2/2016/08/0900_Structure-File.pdf?x94623)


#### example of whole message (todo)

```json
{
    "topic": "lox/set/light/bedroom/main_light",
    "val": 1
}
```

## Configuration (todo - switch to yargs command line)

configuration file has 2 sections

### sections


#### mqtt

It contains host and options for [mqtt](https://github.com/mqttjs/MQTT.js).

[Detailed explanation of the options.](https://github.com/mqttjs/MQTT.js#mqttclientstreambuilder-options)

```json
{
    "mqtt": {
        "host": "mqtt://localhost:1883",
        "options": {
            "username": "test",
            "password": "test1234"
        }
    }
}
```

#### miniserver

It contains:

* **host** - miniserver address (hostname:port)
* **username** - credentials for miniserver
* **password**
* **encrypted** - use AES-256-CBC encrypted web sockets
* **mqtt_prefix** - topic prefix for Loxone™ messages

```json
{
    "miniserver": {
        "host": "192.168.0.77:80",
        "username": "testlox",
        "password": "1234",
        "encrypted": true,
        "mqtt_prefix": "lox"
    }
}
```
### your own config dir

You could use your own config dir

`lox-mqtt-gateway --NODE_CONFIG_DIR='/your/config/dir'`

### example

#### /your/config/dir/default.json

```json
{
    "mqtt": {
        "host": "mqtts://localhost:8883",
        "options": {
            "rejectUnauthorized": false,
            "username": "test",
            "password": "test1234",
            "clientId": "lox_to_mqtt_gateway"
        }
    },
    "miniserver": {
        "host": "192.168.0.77:80",
        "username": "testlox",
        "password": "1234",
        "mqtt_prefix": "lox"
    }
}
```

## Build and run local Docker container

    docker build -t loxone2mqtt .

    docker run --env-file ./loxone.env -it km200 loxone2mqtt 

With an loxone.env file

```
LOXONE_url=mqtt://localhost
LOXONE_userid=admin
LOXONE_password=password
LOXONE_loxone=loxone.local
```

