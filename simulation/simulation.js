var utils = require('./utils.js')

var Simulation = function() {
  this._objects = [];
};

Simulation.prototype.addObject = function(object) {
  this._objects.push(object);
};

Simulation.prototype.computeStep = function(time_delta) {
  for (var i = 0; i < this._objects.length; ++i) {
    try {
      this._objects[i].reconfigure();
    } catch (e) {
      return new utils.ErrorValue(e.stack);
    }
    this._objects[i].computeStep(time_delta);
  }
  this._detectCollisions();
  return new utils.Success();
};

Simulation.prototype._detectCollisions = function() {
  // Simple O(n^2) algorithm.
  var destroyed = {};
  for (var i = 0; i < this._objects.length; ++i) {
    for (var j = i + 1; j < this._objects.length; ++j) {
      // Replace intersection of hitboxes.
      var distance = this._objects[i].distance(this._objects[j]);
      if (distance < 5) {
        destroyed[i] = true;
        destroyed[j] = true;
      }
    }
  }

  var remaining_objects = [];
  for (var i = 0; i < this._objects.length; ++i) {
    if (!(i in destroyed)) {
      remaining_objects.push(this._objects[i]);
    }
  }

  this._objects = remaining_objects;
};

Simulation.prototype._factionsAlive = function() {
  var factions_alive = {};
  for (var i = 0; i < this._objects.length; ++i) {
    var obj_faction = this._objects[i].getProperties().faction;
    if (obj_faction != null) {
      factions_alive[obj_faction] = true;
    }
  }
  return utils.ObjectKeys(factions_alive);
};

Simulation.prototype.finished = function() {
  return this._factionsAlive().length <= 1;
};

Simulation.prototype.dumpFrame = function() {
  var frame = [];
  for (var i = 0; i < this._objects.length; ++i) {
    var object = this._objects[i];
    var object_dump = object.getProperties();
    object_dump.messages = object.collectMessages();
    frame.push(object_dump);
  }
  return frame;
};

module.exports = {
  Simulation: Simulation
};
