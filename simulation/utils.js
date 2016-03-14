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

module.exports = {
  ABSTRACT_METHOD: AbstractMethod,
  ExtendDict: ExtendDict,
  ObjectKeys: ObjectKeys,
  RotateVector: RotateVector
};
