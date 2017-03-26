var assert = require('assert');
var index = require('../src/index.js');

describe('DutyRoster Unit', function () {
    describe('welcome()', function () {
        it('should return a welcome text', function () {
            assert.equal(index.welcome(), 'Welcome!');
        });
    });

    describe('whoIsOnDuty()', function () {
        it('should return the current setting', function () {
            var name = 'Cindy';
            var people = ['Cindy'];
            assert.equal(index.whoIsOnDuty(name, people)[1], 'Cindy');
        });
        it('should tell if there are no people', function () {
            var name, people;
            assert.equal(index.whoIsOnDuty(name, people)[1], undefined);
            assert(index.whoIsOnDuty(name, people)[0].indexOf('no people') > 0);
        });
        it('should choose a person if no one is set', function () {
            var name;
            var people = ['Cindy'];
            assert.equal(index.whoIsOnDuty(name, people)[1], 'Cindy');
            assert(index.whoIsOnDuty(name, people)[0].indexOf('Cindy') > 0);
        });
    });

});
