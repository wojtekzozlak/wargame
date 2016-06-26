
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
        env._util.messages.push(message);
      }
    },
    /* Sensor functions. */
    'GetEnemiesCount': {
      'docs': {
        'comment': 'Returns a count of the enemy ships.'
      },
      'def': function() {
        return env._sensor.enemies.length
      }
    },
    'GetRelativeAngle': {
      'docs': {
        'comment': 'Returns an angle between your ship and given enemy ship.',
        'args': {
          'index': 'An integer.'
        }
      },
      'def': function(index) {
        return env._sensor.relativeAngles[index];
      }
    },
    'GetDistance': {
      'docs': {
        'comment': 'Returns distance between your ship and given enemy ship.',
        'args': {
          'index': 'An integer.'
        }
      },
      'def': function(index) {
        return env._sensor.distances[index];
      }
    },
    /* Weapon functions. */
    'Shoot': {
      'docs': {
        'comment': 'Shoots a rocket (if ammo is available).',
        'args': {
          'index': 'An integer.'
        }
      },
      'def': function(index) {
        env._weapon.shoot = true;
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
