var utils = require('./utils.js');
var vm = require('vm');

var ObjectType = {
  UNKNOWN: 'UNKNOWN',
  SHIP: 'SHIP',
  ROCKET: 'ROCKET'
};


var SimulationObject = function(positionX, positionY, angle, speed, faction) {
  this._positionX = positionX;
  this._positionY = positionY;
  this._angle = angle;
  this._speed = speed;
  this._faction = faction;
  this._messages = [];
};
SimulationObject.prototype.reconfigure = utils.ABSTRACT_METHOD;
SimulationObject.prototype.getProperties = utils.ABSTRACT_METHOD;
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
    faction: this._faction
  };
};
SimulationObject.prototype.distance = function(other) {
  var dx = this._positionX - other._positionX;
  var dy = this._positionY - other._positionY;
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
};


var Rocket = function(positionX, positionY, angle) {
  SimulationObject.call(this, positionX, positionY, angle, /*speed=*/400, /*faction=*/null);
};
Rocket.prototype = Object.create(SimulationObject.prototype);
Rocket.prototype.reconfigure = function() {}
Rocket.prototype._typeId = ObjectType.ROCKET;


Ship = function(positionX, positionY, angle, logic, faction) {
  SimulationObject.call(this, positionX, positionY, angle, /*speed=*/0, faction);
  this._logic = new vm.Script(logic, { displayErrors: true, filename: 'ai.js' });
  this._context = new vm.createContext({ initialized: false });
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

  utils.ExtendDict(this._context, env)
  this._logic.runInContext(this._context);
  this._context.initialized = true;
 
  for (var module_name in this._modules) {
    this._modules[module_name].loadProperties(this._context);
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
EngineModule.prototype.wireShip = function(ship) {
  ShipModule.prototype.wireShip.call(this, ship);
  this._targetAngle = ship._angle;
  this._targetSpeed = ship._speed;
};
EngineModule.prototype.getProperties = function() {
  return {
    currentSpeed: this._ship_speed,
    targetSpeed: this._targetSpeed,
    currentAngle: this._ship._angle,
    targetAngle: this._targetAngle
  };
};
EngineModule.prototype.loadProperties = function(env) {
  /* Assert valid input. */
  this._targetSpeed = env['targetSpeed'];
  this._targetAngle = env['targetAngle'] % 360;
};
EngineModule.prototype.computeStep = function(time_delta) {
  this._adjustAngle(time_delta);
};
EngineModule.prototype._adjustAngle = function(time_delta) {
  var desired_angle_change = this._targetAngle - this._ship._angle;
  this._ship._angle += this._throttledChange(time_delta, this._maneuverability, desired_angle_change);
  var desired_speed_change = this._targetSpeed - this._ship._speed;
  this._ship._speed += this._throttledChange(time_delta, this._acceleration, desired_speed_change);
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
  return {
    ammoAvailable: this._ammoAvailable()
  };
};
WeaponModule.prototype.loadProperties = function(env) {
  if (env.shoot && this._ammoAvailable()) {
    this._time_since_last_shot = 0;
    var ship_properties = this._ship.getProperties();
    var offset = utils.RotateVector(0, 10, ship_properties.angle);
    this._simulation.addObject(new Rocket(ship_properties.x + offset.x,
                                        ship_properties.y + offset.y,
                                        ship_properties.angle));
    this._ship._emitMessage("Shoot!");
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
  var enemies = this._getEnemyShips();
  var relative_angles = [];
  var distances = [];
  for (var i = 0; i < enemies.length; ++i) {
    relative_angles.push(this._relativeAngle(enemies[i]));
    distances.push(this._ship.distance(enemies[i]));
  }
  return {
    relativeAngles: relative_angles,
    distances: distances
  }
};
SensorModule.prototype.loadProperties = function(unused_env) {};
SensorModule.prototype._relativeAngle = function(ship) {
  var a_properties = this._ship.getProperties();
  var b_properties = ship.getProperties();
  var dx = b_properties.x - a_properties.x;
  var dy = b_properties.y - a_properties.y;
  var angle = (360 + Math.atan2(-dx, dy) * 180 / Math.PI) % 360;
  return angle - a_properties.angle;
};
SensorModule.prototype._getEnemyShips = function() {
  var enemies = [];
  for (var i = 0; i < this._simulation._objects.length; ++i) {
    var object = this._simulation._objects[i];
    var object_properties = object.getProperties();
    if (object_properties.typeId == ObjectType.SHIP &&
      object_properties.faction != null &&
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
