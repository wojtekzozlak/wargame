
var Stl = function(env) {
  return {
    /* Sensor functions. */
    'GetEnemiesCount': {
      'comment': 'Returns a count of the enemy ships.',
      'def': function() {
        return env._sensor.enemies.length
      }
    },
    'GetRelativeAngle': {
      'comment': 'Returns an angle between your ship and given enemy ship.',
      'def': function(index) {
        return env._sensor.relativeAngles[index];
      }
    },
    'GetDistance': {
      'comment': 'Returns distance between your ship and given enemy ship.',
      'def': function(index) {
        return env._sensor.distances[index];
      }
    },
    /* Weapon functions. */
    'Shoot': {
      'comment': 'Shoots a rocket (if ammo is available).',
      'def': function(index) {
        env._weapon.shoot = true;
      }
    },
    /* Engine module. */
    'GetCurrentSpeed': {
      'comment': 'Returns current speed of your ship.',
      'def': function() {
        return env._engine.currentSpeed;
      }
    },
    'GetCurrentAngle': {
      'comment': 'Returns a current angle of your ship (relative to north).',
      'def': function() {
        return env._engine.currentAngle;
      }
    },
    'SetTargetSpeed': {
      'comment': 'Sets a target speed of your ship.',
      'def': function(new_speed) {
        env._engine.targetSpeed = new_speed;
      }
    },
    'SetTargetAngle': {
      'comment': 'Sets a target angle of your ship',
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
