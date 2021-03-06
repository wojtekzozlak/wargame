var utils = require('./utils.js')
var model = require('./model.js')

var Simulation = function() {
  this._objects = [];
};

Simulation.prototype.addObject = function(object) {
  this._objects.push(object);
};

Simulation.prototype.reconfigureObjects = function() {
  for (var i = 0; i < this._objects.length; ++i) {
    try {
      this._objects[i].reconfigure();
    } catch (e) {
      var stack = utils.SanitizeTrace(e.stack || '');
      stack = stack || 'Caught error: ' + e;
      err = {
        faction: this._objects[i].getProperties().faction,
        stack: stack
      }
      return new utils.ErrorValue(err);
    }
  }
  return new utils.Success();
};

Simulation.prototype.computeStep = function(time_delta) {
  for (var i = 0; i < this._objects.length; ++i) {
    this._objects[i].computeStep(time_delta);
  }
  this._detectCollisions();
};

Simulation.prototype._detectCollisions = function() {
  // Simple O(n^2) algorithm.
  var destroyed = {};
  for (var i = 0; i < this._objects.length; ++i) {
    // First of all, maybe it is dead already?
    if (!this._objects[i].getProperties().alive) {
      destroyed[i] = true;
    }

    // Or maybe it collided with other objects?
    for (var j = i + 1; j < this._objects.length; ++j) {
      if (this._objects[i].getProperties().faction ==
          this._objects[j].getProperties().faction) {
        continue;
      }
      var geo_a = this._objects[i].getGeometry();
      var geo_b = this._objects[j].getGeometry();
      // Replace intersection of hitboxes.
      if (geo_a.IsCrossing(geo_b)) {
        destroyed[i] = true;
        destroyed[j] = true;
      }
    }
  }

  var remaining_objects = [];
  for (var i = 0; i < this._objects.length; ++i) {
    if (!(i in destroyed)) {
      remaining_objects.push(this._objects[i]);
    } else {
      this._objects[i].destroyed = true;
    }
  }

  this._objects = remaining_objects;
};

Simulation.prototype.factionsAlive = function() {
  var factions_alive = {};
  for (var i = 0; i < this._objects.length; ++i) {
    var obj = this._objects[i];
    if (obj._typeId != model.ObjectType.SHIP) {
      continue;
    }
    var obj_faction = obj.getProperties().faction;
    if (obj_faction != null && !obj.destroyed) {
      factions_alive[obj_faction] = true;
    }
  }
  return utils.ObjectKeys(factions_alive);
};

Simulation.prototype.finished = function() {
  return this.factionsAlive().length <= 1;
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
