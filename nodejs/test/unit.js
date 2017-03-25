var assert = require('assert');
var index = require('../index.js');

describe('DutyRoaster Unit', function() {
  describe('welcome()', function() {
    it('should return a welcome text', function() {
      assert.equal(index.welcome(), 'Welcome!');
    });
  });
  describe('whoIsOnDuty()', function() {

    it('should return a welcome text', function() {
      assert.equal(index.welcome(), 'Welcome!');
    });
  });
});
