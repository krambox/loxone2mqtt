const util = require('util');
const events = require('events');
const unidecode = require('unidecode');

var Adaptor = function (structure, log) {
  this.log = log;
  this.structure = structure;

  this.room2name = {};
  this.cat2name = {};
  this.path2control = {};
  this.controlid2path = {};
  this.stateuuid2path = {};
  this.buildRooms();
  this.buildCats();
  this.buildPaths();

  this.registerEvents();
};

util.inherits(Adaptor, events.EventEmitter);

Adaptor.prototype.setValueForUUID = function (uuid, value) {
  this.structure.set_value_for_uuid(uuid, value);
};

Adaptor.prototype.getCommandFromTopic = function (topic, data) {
  var pathGroups = topic.match('^(.+)/cmd$');
  if (!pathGroups) {
    return {};
  }
  var control = this.path2control[pathGroups[1]];
  if (!control) {
    return {};
  }
  return {
    'uuidAction': control.uuidAction,
    'command': data
  };
};

Adaptor.prototype.abort = function () {
  this.structure.removeAllListeners();
  this.structure = undefined;
  this.removeAllListeners();
};

Adaptor.prototype.buildRooms = function () {
  Object.keys(this.structure.rooms.items).forEach(function (key) {
    var room = this.structure.rooms.items[key];
    var name = this.normalizeName(room.name);
    this.room2name[room.uuid] = name;
  }, this);
};

Adaptor.prototype.buildCats = function () {
  Object.keys(this.structure.categories.items).forEach(function (key) {
    var cat = this.structure.categories.items[key];
    var name = this.normalizeName(cat.name);
    this.cat2name[cat.uuid] = name;
  }, this);
};

Adaptor.prototype.buildPaths = function () {
  Object.keys(this.structure.controls.items).forEach(function (key) {
    var control = this.structure.controls.items[key];
    this.addControl(control);
    if (control.subControls !== undefined) {
      Object.keys(control.subControls.items).forEach(function (subKey) {
        this.addControl(control.subControls.items[subKey], control.room, control.category);
      }, this);
    }
  }, this);

  this.controlid2path[this.structure.globalStates.id] = 'miniserver/global';
  this.path2control['miniserver/global'] = this.structure.globalStates;
  Object.keys(this.structure.globalStates).forEach(function (key) {
    this.stateuuid2path[this.structure.globalStates[key].uuid] = 'miniserver/global/raw_state/' + key;
  }, this);
  this.log.debug('controlid2path');
  this.log.debug(this.controlid2path);
  this.log.debug('path2control');
  // this.log.debug(this.path2control);
  this.log.debug('stateuuid2path');
  this.log.debug(this.stateuuid2path);
};

Adaptor.prototype.registerEvents = function () {
  var that = this;
  Object.keys(this.path2control).forEach(function (path) {
    this.log.info(path);
    this.path2control[path].on('state_update', function (control) {
      if (that.controlid2path[control.id] !== undefined) {
        var value;
        if (control.states) {
          if (control.states.items) {
            if (control.states.items['active']) {
              value = control.states.items['active'].value;
            } else if (control.states.items.actual) {
              value = control.states.items['actual'].value;
            } else if (control.states.items.activeScene) {
              value = control.states.items['activeScene'].value;
            } else if (control.states.items.value) {
              value = control.states.items['value'].value;
            } else if (control.states.items.position) {
              value = control.states.items['position'].value;
            } else {
              // value = control.states.items;
            }
          }
        } else {
          // value = control.states;
        }
        var data = {
          val: value,
          ts: Math.floor(new Date() / 1000),
          raw: control.get_state()
        };
        that.emit('for_mqtt', that.controlid2path[control.id], JSON.stringify(data));
      } else {
        throw new Error('Invalid control! - path');
      }
    });
  }, this);
};

Adaptor.prototype.addControl = function (control, defaultRoom, defaultCategory) {
  var name = this.normalizeName(control.name);
  var room = this.room2name[control.room];
  if (room === undefined) {
    room = this.room2name[defaultRoom];
  }
  var category = this.cat2name[control.category];
  if (category === undefined) {
    category = this.cat2name[defaultCategory];
  }
  var path = room + '/' + category + '/' + name;
  this.path2control[path] = control;
  this.controlid2path[control.id] = path;
  if (control.states !== undefined) {
    Object.keys(control.states.items).forEach(function (stateKey) {
      this.stateuuid2path[control.states.items[stateKey].uuid] = path + '/raw_state/' + stateKey;
    }, this);
  }
};

Adaptor.prototype.normalizeName = function (name) {
  return unidecode('' + name).replace(/\s+/g, '_').toLowerCase();
};

module.exports = Adaptor;
