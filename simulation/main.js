var model = require('./model.js');
var readline = require('readline');
var simulation = require('./simulation.js');
var utils = require('./utils.js')

var FPS = 50;
var DELTA_PER_FRAME = 1000 / FPS;


var ReadInput = function(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  var lines = [];
  rl.on('line', function(cmd) {
    lines.push(cmd);
  });

  rl.on('close', function(cmd) {
    var input = lines.join('\n');
    callback(JSON.parse(input));
    
  });
};


var RunSimulation = function(data) {
  var sim = new simulation.Simulation();
  for (var i = 0; i < data.players.length; ++i) {
    var player = data.players[i];
    var ship = new model.Ship(200 * (i - 1), 50 * (i - 1), 180 * (i - 1), player.logic, player.name);
    ship.registerModule("engine", new model.EngineModule());
    ship.registerModule("weapons", new model.WeaponModule(sim));
    ship.registerModule("sensors", new model.SensorModule(sim));
    sim.addObject(ship);

  }

  for (var elapsed = 0; !sim.finished() && elapsed < data.maxDurationMs; elapsed += DELTA_PER_FRAME) {
    var result = sim.computeStep(DELTA_PER_FRAME);
    if (!result.ok) {
      console.log(result.error_value);
      return;
    }
    console.log(JSON.stringify(sim.dumpFrame()));
  }
};

ReadInput(RunSimulation);


