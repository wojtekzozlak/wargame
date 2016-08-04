var checkIsNumeric = function(value) {
  if (!isFinite(value) || isNaN(parseFloat(value))) {
    throw new Error("'" + value + "' is not a finite number!");
  }
};

var Stl = function(env) {
  return {
    /* Utility. */
    'Log': {
      'docs': {
        'comment': 'Logs given string.',
        'args': {
          'message': 'A string.'
        }
      },
      'def': function(message) {
        if (message == undefined) {
          message = 'undefined';
        } else if (message == null) {
          message = 'null';
        }
        env._util.messages.push(JSON.stringify(message));
      }
    },
    /* Sensor functions. */
    'GetEnemies': {
      'docs': {
        'comment': ['Returns a list of enemies. Each entry is an object with following properties:',
                    '',
                    ' * `angle` - an absolute angle of the enemy.',
                    ' * `relativeAngle` - an angle relative of to the Player\'s ship.',
                    ' * `speed` - an absolute speed of the enemy.',
                    ' * `distance` - a distance between enemy and the Player\'s ship.',
                    ' * `type` - a type of the enemy (either `SHIP` or `ROCKET`).'].join('\n')
      },
      'def': function() {
        return env._sensor.enemies;
      }
    },
    /* Weapon functions. */
    'Shoot': {
      'docs': {
        'comment': 'Shoots a rocket (if ammo is available). At given angle. It is possible to '
                   + 'shoot multiple rockets in a single iteration.',
        'args': {
          'angle': 'An integer between [-15, 15]. Angle relative to the ship\'s current angle.'
        }
      },
      'def': function(angle) {
        angle = angle == undefined ? 0 : angle;
        checkIsNumeric(angle);
        env._weapon.shoot.push(angle);
      }
    },
    'GetTimeUntilReload': {
      'docs': {
        'comment': 'Returns time (in ms) until reload is completed (Infinity if there is '
                   + 'already maximum number of rockets.'
      },
      'def': function() {
        return env._weapon.timeUntilReload
      }
    },
    'GetAvailableAmmo': {
      'docs': {
        'comment': 'Returns a number of available rockets.',
      },
      'def': function() {
        return env._weapon.ammoAvailable;
      }
    },
    /* Engine module. */
    'GetCurrentSpeed': {
      'docs': {
        'comment': 'Returns current speed of your ship.'
      },
      'def': function() {
        return env._engine.currentSpeed;
      }
    },
    'GetCurrentAngle': {
      'docs': {
        'comment': 'Returns a current angle of your ship (relative to north).'
      },
      'def': function() {
        return env._engine.currentAngle;
      }
    },
    'SetTargetSpeed': {
      'docs': {
        'comment': 'Sets a target speed of your ship.',
        'args': {
          'new_speed': 'An integer.'
        }
      },
      'def': function(new_speed) {
        checkIsNumeric(new_speed);
        env._engine.targetSpeed = new_speed;
      }
    },
    'SetTargetAngle': {
      'docs': {
        'comment': 'Sets a target angle of your ship',
        'args': {
          'new_angle': 'An integer.'
        }
      },
      'def': function(new_angle) {
        checkIsNumeric(new_angle); 
        env._engine.targetAngle = new_angle;
      }
    }
  };
};

var _GetFromStl = function(stl, key) {
  var result = {};
  for (fn_name in stl) {
    result[fn_name] = stl[fn_name][key];
  }
  return result;
};

var GetStlFunctions = function(env) {
  return _GetFromStl(new Stl(env), 'def');
};

var GetStlDocs = function() {
  return _GetFromStl(new Stl(), 'docs');
};

module.exports = {
  GetStlFunctions: GetStlFunctions,
  GetStlDocs: GetStlDocs
};
