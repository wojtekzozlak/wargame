var assert = require('assert');
var g = require('./geometry');

describe('CrossingLineSegments', function() {
  it('should return false when are not crossing', function() {
    assert.equal(
        g.CrossingLineSegments(new g.Point(5, 5), new g.Point(10, 7),
                               new g.Point(6, 9), new g.Point(10, 10)),
        false);
    assert.equal(
        g.CrossingLineSegments(new g.Point(10, 7), new g.Point(5, 5),
                               new g.Point(10, 10), new g.Point(6, 9)),
        false);
    assert.equal(
        g.CrossingLineSegments(new g.Point(5, 5), new g.Point(6, 9),
                               new g.Point(10, 7), new g.Point(10, 10)),
        false);
    assert.equal(
        g.CrossingLineSegments(new g.Point(6, 9), new g.Point(5, 5),
                               new g.Point(10, 10), new g.Point(10, 7)),
        false);
  });

  it('should return true when are crossing', function() {
     assert.equal(
        g.CrossingLineSegments(new g.Point(5, 5), new g.Point(10, 10),
                               new g.Point(10, 7), new g.Point(6, 9)),
        true);
     assert.equal(
        g.CrossingLineSegments(new g.Point(10, 10), new g.Point(5, 5),
                               new g.Point(6, 9), new g.Point(10, 7)),
        true);
     assert.equal(
        g.CrossingLineSegments(new g.Point(10, 10), new g.Point(5, 5),
                               new g.Point(10, 7), new g.Point(6, 9)),
        true);
     assert.equal(
        g.CrossingLineSegments(new g.Point(5, 5), new g.Point(10, 10),
                               new g.Point(6, 9), new g.Point(10, 7)),
        true);
  });
});
