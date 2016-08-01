var utils = require('./utils.js');
var geometry = require('./geometry.js');
var stl = require('./stl.js')
var vm = require('vm');

var ObjectType = {
  UNKNOWN: 'UNKNOWN',
  SHIP: 'SHIP',
  ROCKET: 'ROCKET'
};


var NormalizeRelativeAngle = function(relative_angle) {
  relative_angle  = (relative_angle + 360) % 360;
  if (relative_angle < 180) {
    return relative_angle;
  } else {
    return relative_angle - 360;
  }
};

var SimulationObject = function(positionX, positionY, angle, speed, faction, geometry) {
  this._positionX = positionX;
  this._positionY = positionY;
  this._angle = angle;
  this._speed = speed;
  this._alive = true;
  this._faction = faction;
  this._messages = [];
  this._geometry = geometry;
};
SimulationObject.prototype.reconfigure = utils.ABSTRACT_METHOD;
SimulationObject.prototype.getProperties = utils.ABSTRACT_METHOD;
SimulationObject.prototype.getGeometry = function() {
  return this._geometry
      .Rotated(this._angle)
      .Translated(new geometry.Vector(this._positionX, this._positionY));
}
SimulationObject.prototype._typeId = ObjectType.UNKNOWN;
SimulationObject.prototype._emitMessage = function(msg) {
  this._messages.push(msg);
};
SimulationObject.prototype.collectMessages = function() {
  var tmp = this._messages;
  this._messages = [];
  return tmp;
};
SimulationObject.prototype.computeStep = function(time_delta) {
  var movement = utils.RotateVector(0, this._speed * time_delta / 1000, this._angle);
  this._positionX += movement.x;
  this._positionY += movement.y;
};
SimulationObject.prototype.getProperties = function() {
  return {
    x: this._positionX,
    y: this._positionY,
    angle: this._angle,
    typeId: this._typeId,
    faction: this._faction,
    alive: this._alive
  };
};
SimulationObject.prototype.distance = function(other) {
  var dx = this._positionX - other._positionX;
  var dy = this._positionY - other._positionY;
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
};


var Rocket = function(positionX, positionY, angle, faction) {
  var g = new geometry.Poly([new geometry.Point(-2, 10), new geometry.Point(2, 10),
                             new geometry.Point(2, -10), new geometry.Point(-2, -10)]);
  SimulationObject.call(this, positionX, positionY, angle, /*speed=*/400, faction,
                        g);
  this._lifeTime = 1500;
};
Rocket.prototype = Object.create(SimulationObject.prototype);
Rocket.prototype.computeStep = function(time_delta) {
  SimulationObject.prototype.computeStep.call(this, time_delta);
  this._lifeTime -= time_delta;
  if (this._lifeTime < 0) {
    this._alive = false
  }
};
Rocket.prototype.reconfigure = function() {}
Rocket.prototype._typeId = ObjectType.ROCKET;


Ship = function(positionX, positionY, angle, logic, faction) {
  var g = new geometry.Poly([new geometry.Point(0, 15), new geometry.Point(10, -15),
                             new geometry.Point(-10, -15)]);
  SimulationObject.call(this, positionX, positionY, angle, /*speed=*/100, faction, g);
  this._logic = new vm.Script(logic, { displayErrors: true, filename: 'ai.js' });
  this._context = new vm.createContext({ initialized: false });
  utils.ExtendDict(this._context, stl.GetStlFunctions(this._context));
  this._modules = {};
};
Ship.prototype = Object.create(SimulationObject.prototype);
Ship.prototype._typeId = ObjectType.SHIP;
Ship.prototype.computeStep = function(time_delta) {
  for (var module_name in this._modules) {
    this._modules[module_name].computeStep(time_delta);
  }
  SimulationObject.prototype.computeStep.call(this, time_delta);
};
Ship.prototype._getInnerProperties = function() {
  var properties = {};
  properties._util = {
    messages: []
  };
  for (var module_name in this._modules) {
    utils.ExtendDict(properties, this._modules[module_name].getProperties());  
  }
  return properties;
};
Ship.prototype.registerModule = function(name, module) {
  this._modules[name] = module;
  module.wireShip(this)
};
Ship.prototype.reconfigure = function() {
  var env = this._getInnerProperties();

  utils.ExtendDict(this._context, env);
  this._logic.runInContext(this._context);
  this._context.initialized = true;
 
  for (var module_name in this._modules) {
    this._modules[module_name].loadProperties(this._context);
  }
  for (var i = 0; i < this._context._util.messages.length; ++i) {
    this._emitMessage(this._context._util.messages[i]);
  }
};


var ShipModule = function() {
  this._ship = null;
};
ShipModule.prototype.wireShip = function(ship) {
  this._ship = ship;
};
ShipModule.prototype.getProperties = utils.ABSTRACT_METHOD;
ShipModule.prototype.loadProperties = utils.ABSTRACT_METHOD;
ShipModule.prototype.computeStep = function(unused_time_delta) {};


var EngineModule = function() {
  ShipModule.call(this);
  this._maneuverability = 90;  // 90 deg per second.
  this._acceleration = 25;  // 25 units per second.
  this._targetAngle = 0;
  this._targetSpeed = 0;
};
EngineModule.prototype = Object.create(ShipModule.prototype);
EngineModule.prototype.MAX_SHIP_SPEED = 200;
EngineModule.prototype.wireShip = function(ship) {
  ShipModule.prototype.wireShip.call(this, ship);
  this._targetAngle = ship._angle;
  this._targetSpeed = ship._speed;
};
EngineModule.prototype.getProperties = function() {
  return {
    '_engine': {
      currentSpeed: this._ship._speed,
      targetSpeed: this._targetSpeed,
      currentAngle: this._ship._angle,
      targetAngle: this._targetAngle
    }
  };
};
EngineModule.prototype.loadProperties = function(env) {
  /* Assert valid input. */
  this._targetSpeed = parseInt(env._engine.targetSpeed);
  this._targetAngle = parseInt(env._engine.targetAngle) % 360;
};
EngineModule.prototype.computeStep = function(time_delta) {
  this._adjustAngle(time_delta);
};
EngineModule.prototype._adjustAngle = function(time_delta) {
  var desired_angle_change = NormalizeRelativeAngle(this._targetAngle - this._ship._angle);
  if (desired_angle_change > 180) {
    desired_angle_change -= 360;
  }
  this._ship._angle += this._throttledChange(time_delta, this._maneuverability, desired_angle_change);
  this._ship._angle %= 360
  var desired_speed_change = this._targetSpeed - this._ship._speed;
  this._ship._speed += this._throttledChange(time_delta, this._acceleration, desired_speed_change);
  this._ship._speed = Math.min(this._ship._speed, this.MAX_SHIP_SPEED);
};
EngineModule.prototype._throttledChange = function(time_delta, change_speed, desired_change) {
  var max_change = change_speed * time_delta / 1000;
  var throttled_change = Math.min(desired_change, max_change);
  throttled_change = Math.max(throttled_change, -max_change);
  return throttled_change;
};


var WeaponModule = function(simulation) {
  ShipModule.call(this);
  this._simulation = simulation;
  this._time_since_last_shot = utils.MAX_SAFE_INTEGER;
  this._reload_time = 1000;
};
WeaponModule.prototype = Object.create(ShipModule.prototype);
WeaponModule.prototype._ammoAvailable = function() {
  return this._time_since_last_shot >= this._reload_time;
};
WeaponModule.prototype.getProperties = function() {
  var ammo_available = this._ammoAvailable();
  return {
    '_weapon': {
      'ammoAvailable': ammo_available,
      'shoot': undefined,
    },
  }
};
WeaponModule.prototype.loadProperties = function(env) {
  if (env._weapon.shoot != undefined && this._ammoAvailable()) {
    this._time_since_last_shot = 0;
    var ship_properties = this._ship.getProperties();
    var angle = env._weapon.shoot;
    angle = Math.min(15, Math.max(-15, angle));
    angle = (ship_properties.angle + angle + 360) % 360;
    this._simulation.addObject(new Rocket(ship_properties.x,
                                          ship_properties.y,
                                          angle,
                                          ship_properties.faction));
  }
};
WeaponModule.prototype.computeStep = function(time_delta) {
  this._time_since_last_shot += time_delta;
};


var SensorModule = function(simulation) {
   ShipModule.call(this);
   this._simulation = simulation;
};
SensorModule.prototype = Object.create(ShipModule.prototype);
SensorModule.prototype.getProperties = function() {
  var enemy_ships = this._getEnemyShips();
  var enemy_stats = [];
  for (var i = 0; i < enemy_ships.length; ++i) {
    var enemy = enemy_ships[i];
    var stats = {};
    stats.angle = enemy._angle
    stats.relativeAngle = this._relativeAngle(enemy);
    stats.speed = enemy._speed;
    stats.distance = this._ship.distance(enemy);
    stats.type = enemy._typeId
    enemy_stats.push(stats);
  }
  return {
    '_sensor': {
      'enemies' : enemy_stats,
    }
  }
};
SensorModule.prototype.loadProperties = function(unused_env) {};
SensorModule.prototype._relativeAngle = function(ship) {
  var a_properties = this._ship.getProperties();
  var b_properties = ship.getProperties();
  var dx = b_properties.x - a_properties.x;
  var dy = b_properties.y - a_properties.y;
  var angle = (Math.atan2(-dx, dy) * 180 / Math.PI + 360) % 360;
  return NormalizeRelativeAngle(angle - a_properties.angle);
};
SensorModule.prototype._getEnemyShips = function() {
  var enemies = [];
  for (var i = 0; i < this._simulation._objects.length; ++i) {
    var object = this._simulation._objects[i];
    var object_properties = object.getProperties();
    if (object_properties.faction != null &&
        object_properties.faction != this._ship._faction) {
      enemies.push(object);
    }
  }
  return enemies;
}

module.exports = {
  ObjectType: ObjectType,
  Rocket: Rocket,
  Ship: Ship,
  EngineModule: EngineModule,
  WeaponModule: WeaponModule,
  SensorModule: SensorModule
};
