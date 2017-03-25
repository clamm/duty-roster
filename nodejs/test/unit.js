var assert = require('assert');
var index = require('../src/index.js');

describe('DutyRoster Unit', function() {
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
