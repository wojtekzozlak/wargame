const MAX_SAFE_INTEGER = Math.pow(2, 53); 

var AbstractMethod = function() {
  throw 'Not Implemented!';
};

var RotateVector = function(x, y, angle) {
  var rad_angle = angle * Math.PI / 180;
  var dx = x * Math.cos(rad_angle) - y * Math.sin(rad_angle);
  var dy = x * Math.sin(rad_angle) + y * Math.cos(rad_angle);
  return {x: dx, y: dy};
};

var ObjectKeys = function(obj) {
  var result = [];
  for (var k in obj) {
    result.push(k);
  }
  return result;
};

var ExtendDict = function(a, b) {
  for (var attr in b) {
    a[attr] = b[attr];
  }
}

var SanitizeTrace = function(stacktrace) {
  return stacktrace.substr(0, stacktrace.indexOf('at Script')).trim();
};

var SuccessOrErrorValue = function(error_value) {
  this.ok = (error_value == undefined);
  if (!this.ok) {
    this.error_value = error_value;
  }
};

var Success = function() {
  SuccessOrErrorValue.call(this);
};

var ErrorValue = function(error_value) {
  SuccessOrErrorValue.call(this, error_value);
};

module.exports = {
  ABSTRACT_METHOD: AbstractMethod,
  ExtendDict: ExtendDict,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER,
  ObjectKeys: ObjectKeys,
  RotateVector: RotateVector,
  SanitizeTrace: SanitizeTrace,
  Success: Success,
  ErrorValue: ErrorValue
};
