var assert = require('assert');
var expect = require('expect.js')
var g = require('./geometry');

describe('CrossingLineSegments', function() {
  it('should return false when are not crossing', function() {
    assert.equal(
        g.CrossingLineSegments(
            new g.LineSegment(new g.Point(5, 5), new g.Point(10, 7)),
            new g.LineSegment(new g.Point(6, 9), new g.Point(10, 10))),
        false);
    assert.equal(
        g.CrossingLineSegments(
            new g.LineSegment(new g.Point(10, 7), new g.Point(5, 5)),
            new g.LineSegment(new g.Point(10, 10), new g.Point(6, 9))),
        false);
    assert.equal(
        g.CrossingLineSegments(
            new g.LineSegment(new g.Point(5, 5), new g.Point(6, 9)),
            new g.LineSegment(new g.Point(10, 7), new g.Point(10, 10))),
        false);
    assert.equal(
        g.CrossingLineSegments(
            new g.LineSegment(new g.Point(6, 9), new g.Point(5, 5)),
            new g.LineSegment(new g.Point(10, 10), new g.Point(10, 7))),
        false);
  });

  it('should return true when are crossing', function() {
     assert.equal(
        g.CrossingLineSegments(
            new g.LineSegment(new g.Point(5, 5), new g.Point(10, 10)),
            new g.LineSegment(new g.Point(10, 7), new g.Point(6, 9))),
        true);
     assert.equal(
        g.CrossingLineSegments(
            new g.LineSegment(new g.Point(10, 10), new g.Point(5, 5)),
            new g.LineSegment(new g.Point(6, 9), new g.Point(10, 7))),
        true);
     assert.equal(
        g.CrossingLineSegments(
            new g.LineSegment(new g.Point(10, 10), new g.Point(5, 5)),
            new g.LineSegment(new g.Point(10, 7), new g.Point(6, 9))),
        true);
     assert.equal(
        g.CrossingLineSegments(
            new g.LineSegment(new g.Point(5, 5), new g.Point(10, 10)),
            new g.LineSegment(new g.Point(6, 9), new g.Point(10, 7))),
        true);
    assert.equal(
        g.CrossingLineSegments(
            new g.LineSegment(new g.Point(0, 0), new g.Point(5, 5)),
            new g.LineSegment(new g.Point(5, 5), new g.Point(10, 8))),
        true);
    assert.equal(
        g.CrossingLineSegments(
            new g.LineSegment(new g.Point(0, 10), new g.Point(0, 5)),
            new g.LineSegment(new g.Point(-5, 10), new g.Point(5, 10))),
        true)
  });
});

describe('Poly', function() {
  describe('_GetSegments', function() {
    it('should return list of segments', function() {
      var poly = new g.Poly([new g.Point(0, 0), new g.Point(5, 5), new g.Point(3, 7)]);
      expect(poly._GetSegments()).to.eql(
          [new g.LineSegment(new g.Point(0, 0), new g.Point(5, 5)),
           new g.LineSegment(new g.Point(5, 5), new g.Point(3, 7)),
           new g.LineSegment(new g.Point(3, 7), new g.Point(0, 0))]);
    });
  });

  describe('Translate', function() {
    it('should translate all points', function() {
      var poly = new g.Poly([new g.Point(0, 0), new g.Point(5, 5), new g.Point(3, 7)]);
      var expected_poly = new g.Poly([new g.Point(2, -1), new g.Point(7, 4), new g.Point(5, 6)]);
      expect(poly.Translated(new g.Vector(2, -1))).to.eql(expected_poly);
    });
  });

  describe('Crossing', function() {
    it('should return true if poly cross the other poly', function() {
      var poly_a = new g.Poly([new g.Point(0, 10), new g.Point(5, 0), new g.Point(-5, 0)]);
      var poly_b = new g.Poly([new g.Point(5, 10), new g.Point(5, -10), new g.Point(-5, -10), new g.Point(-5, 10)]);

      assert.equal(poly_a.IsCrossing(poly_b), true);
      assert.equal(poly_a.IsCrossing(poly_b.Translated(new g.Vector(10, -10))), true);
      assert.equal(poly_a.Translated(new g.Vector(0, -10)).IsCrossing(poly_b), true);

      assert.equal(poly_a.IsCrossing(poly_b.Translated(new g.Vector(100, 100))), false);
      assert.equal(poly_a.IsCrossing(poly_b.Translated(new g.Vector(0, -10))), true);
      assert.equal(poly_a.IsCrossing(poly_b.Translated(new g.Vector(0, -10.1))), false);
    });
  });
});
