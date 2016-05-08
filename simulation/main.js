var model = require('./model.js');
var readline = require('readline');
var simulation = require('./simulation.js');
var utils = require('./utils.js')

var FPS = 50;
var DELTA_PER_FRAME = 1000 / FPS;
var RECONFIGURE_EVERY_MS = 100;


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

  rl.on('close', function() {
    var input = lines.join('\n');
    callback(JSON.parse(input));
  });
};


var RunSimulation = function (data) {
  var sim = new simulation.Simulation();
  for (var i = 0; i < data.players.length; ++i) {
    var player = data.players[i];
    var ship = new model.Ship(200 * (i - 1), 50 * (i - 1), 180 * (i - 1), player.logic, player.name);
    ship.registerModule("engine", new model.EngineModule());
    ship.registerModule("weapons", new model.WeaponModule(sim));
    ship.registerModule("sensors", new model.SensorModule(sim));
    sim.addObject(ship);
  }

  var output = [];

  var error = null;
  for (var elapsed = 0, since_last_reconfiguration = RECONFIGURE_EVERY_MS;
       !sim.finished() && elapsed < data.maxDurationMs;
       elapsed += DELTA_PER_FRAME, since_last_reconfiguration += DELTA_PER_FRAME) {
    if (since_last_reconfiguration >= RECONFIGURE_EVERY_MS) {
      var result = sim.reconfigureObjects(); 
      if (!result.ok) {
        error = result.error_value;
        break;
      }
      since_last_reconfiguration = 0;
    }

    sim.computeStep(DELTA_PER_FRAME)
    output.push({
      type: 'FRAME',
      contents: sim.dumpFrame()
    });
  }
  var result = { type: 'OUTCOME' };
  if (error) {
    result.outcome = 'ERROR';
    result.faction = error.faction;
    result.stack = error.stack;
  } else if(sim.finished()) {
    result.outcome = 'WINNER';
    result.faction = sim.factionsAlive()[0];
  } else {
    result.outcome = 'TIE';
  }
  output.push(result);

  console.log(JSON.stringify(output));
};

ReadInput(RunSimulation);


