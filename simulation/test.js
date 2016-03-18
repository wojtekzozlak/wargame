var model = require('./model.js');
var simulation = require('./simulation.js');
var utils = require('./utils.js')

var TIME_LIMIT = 120000;
var FPS = 50;
var DELTA_PER_FRAME = 1000 / FPS;


var sim = new simulation.Simulation();
var logic_arr = [ "if (!initialized) { i = 0; }; targetAngle = 180; \n targetSpeed = 100; \n i++; if (i == 5) { aaa; throw new Error('MY ERROR'); }",
	          "targetAngle = targetAngle + relativeAngles[0]; targetSpeed = 150; if (distances[0] < 150) {   shoot = true; };"];

for (var i = 1; i <= 2; ++i) {
  var logic = logic_arr[i-1];
  var ship = new model.Ship(200 * (i - 1), 50 * (i - 1), 180 * (i - 1), logic, "player" + i);
  ship.registerModule("engine", new model.EngineModule());
  ship.registerModule("weapons", new model.WeaponModule(sim));
  ship.registerModule("sensors", new model.SensorModule(sim));
  sim.addObject(ship);
}

for (var i = 0; !sim.finished() && i < TIME_LIMIT; i+=DELTA_PER_FRAME) {
  sim.computeStep(DELTA_PER_FRAME);
  console.log(JSON.stringify(sim.dumpFrame()));
}

