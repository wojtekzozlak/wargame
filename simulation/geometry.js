var Point = function(x, y) {
  this.x = x;
  this.y = y;
};
Point.prototype.Translate = function(vector) {
  this.x += vector.dx;
  this.y += vector.dy;
};

var Det3 = function(m) {
 return (m[0][0] * m[1][1] * m[2][2]) + (m[1][0] * m[2][1] * m[0][2]) +
        (m[2][0] * m[0][1] * m[1][2]) - (m[1][0] * m[0][1] * m[2][2]) -
        (m[0][0] * m[2][1] * m[1][2]) - (m[2][0] * m[1][1] * m[0][2]);
};

var PointDet3 = function(p, q, r) {
  return Det3([[p.x, p.y, 1], [q.x, q.y, 1], [r.x, r.y, 1]]);
};

var InBetween = function(p1, p2, q) {
  if (Math.min(p1.x, p2.x) <= q.x &&
      q.x <= Math.max(p1.x, p2.x) &&
      Math.min(p1.y, p2.y) <= q.x &&
      q.x <= Math.max(p1.y, p2.y)) {
    return true;
  } else{
    return false;
  }
}


var Segment = function(p, q) {
  this.p = p;
  this.q = q;
};

var CrossingLineSegments = function(p1, p2, q1, q2) {
  var d1 = PointDet3(q1, q2, p1);
  var d2 = PointDet3(q1, q2, p2);
  var d3 = PointDet3(p1, p2, q1);
  var d4 = PointDet3(p1, p2, q2);
  if (d1 * d2 < 0 && d3 * d4 < 0) {
    return true;
  }
  if (d1 == 0 && InBetween(q1, q2, p1)) {
    return true;
  }
  if (d2 == 0 && InBetween(q1, q2, p2)) {
    return true;
  }
  if (d3 == 0 && InBetween(p1, p2, q1)) {
    return true;
  }
  if (d4 == 0 && InBetween(p1, p2, q2)) {
    return true;
  }
  return false;
};

var Poly = function(points) {
  this.points = points;
};
Poly.prototype.GetSegments = function() {
  var segments = [];
  for (var i = 0; i < this.points.length; ++i) {
    var j = (i + 1) % this.points.length;
    segments.push();
  }
};
Poly.prototype.Crossing = function(other) {
};

module.exports = {
  CrossingLineSegments: CrossingLineSegments,
  Point: Point,
  Poly: Poly
};
