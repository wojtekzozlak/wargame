var Point = function(x, y) {
  this.x = x;
  this.y = y;
};
Point.prototype.Translated = function(vector) {
  return new Point(this.x + vector.dx, this.y + vector.dy);
};

var Vector = function(dx, dy) {
  this.dx = dx;
  this.dy = dy;
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
  if (Math.min(p1.x, p2.x) <= q.x && q.x <= Math.max(p1.x, p2.x) &&
      Math.min(p1.y, p2.y) <= q.y && q.y <= Math.max(p1.y, p2.y)) {
    return true;
  } else{
    return false;
  }
}


var LineSegment = function(a, b) {
  this.a = a;
  this.b = b;
};

var CrossingLineSegments = function(p, q) {
  var d1 = PointDet3(q.a, q.b, p.a);
  var d2 = PointDet3(q.a, q.b, p.b);
  var d3 = PointDet3(p.a, p.b, q.a);
  var d4 = PointDet3(p.a, p.b, q.b);
  if (d1 * d2 < 0 && d3 * d4 < 0) {
    return true;
  } else if (d1 == 0 && InBetween(q.a, q.b, p.a)) {
    return true;
  } else if (d2 == 0 && InBetween(q.a, q.b, p.b)) {
    return true;
  } else if (d3 == 0 && InBetween(p.a, p.b, q.a)) {
    return true;
  } else if (d4 == 0 && InBetween(p.a, p.b, q.b)) {
    return true;
  }
  return false;
};

var Poly = function(points) {
  this.points = points;
};
Poly.prototype._GetSegments = function() {
  var segments = [];
  for (var i = 0; i < this.points.length; ++i) {
    var j = (i + 1) % this.points.length;
    segments.push(new LineSegment(this.points[i], this.points[j]));
  }
  return segments;
};
Poly.prototype.IsCrossing = function(other) {
  var segments_a = this._GetSegments();
  var segments_b = other._GetSegments();
  for (var i = 0; i < segments_a.length; ++i) {
    for (var j = 0; j < segments_b.length; ++j) {
      if (CrossingLineSegments(segments_a[i], segments_b[j])) {
        return true;
      }
    } 
  }
  return false;
};
Poly.prototype.Translated = function(vector) {
  var translated_points = []
  for (var i = 0; i < this.points.length; ++i) {
    translated_points.push(this.points[i].Translated(vector));
  }
  return new Poly(translated_points);
};

module.exports = {
  CrossingLineSegments: CrossingLineSegments,
  LineSegment: LineSegment,
  Point: Point,
  Poly: Poly,
  Vector: Vector
};
