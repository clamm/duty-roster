// This is a Javascript test harness that simulates the execution of Lambda
// function code From the command prompt, type 'node test.js'
var assert = require('assert');
var DynamoDB = require('../src/dynamodb.js');

// assumes single Lambda function with exports.handler
var MyLambdaFunction = require('../src/index.js');


function getSpeech(response) {
  return response['response']['outputSpeech']['ssml'];
}

function getSessionAttributes(response) {
  return response['sessionAttributes'];
}

var context = function(expected, done) {
  return {
    'succeed': function(data) {
      // console.log(JSON.stringify(data, null, '\t'));
      assert.equal(getSpeech(data), expected);
      done();
    },
    'fail': function(err) {
      console.log('context.fail occurred');
      console.log(JSON.stringify(err, null, '\t'));
      assert.fail();
    }
  };
};

function getEvent(userId, type, intent, slots) {
  var applicationId = 'amzn1.ask.skill.1234';
  var sessionId = 'SessionId.1234';

  var session = {
    'sessionId': sessionId,
    'application': {
      'applicationId': applicationId
    },
    'attributes': {},
    'user': {
      'userId': userId
    },
    'new': true
  };

  var request = {
    'type': type,
    'requestId': 'request5678',
    'locale': 'en-US'
  };

  if (intent !== undefined) {
    request['intent'] = {
      'name': intent
    };
  }

  if (slots !== undefined) {
    request['intent']['slots'] = slots;
  }

  return {
    'session': session,
    'request': request,
    'version': '1.0'
  };
}

var userId = 'node.tests';
var userIdNoData = userId + '.nodata';
var deleteParams = function(id) {
  return {
    'TableName': MyLambdaFunction.tableName,
    'Key': {
      'userId': id
    }
  };
};

// actual test scenarios
describe('DutyRoster Integration', function() {

  describe('LaunchRequest', function() {
    it('should return a welcome text', function(done) {
      var event = getEvent(userId, 'LaunchRequest');
      var expected = '<speak> Welcome! </speak>';
      MyLambdaFunction['handler'](event, context(expected, done), done);
    });
  });


  describe('Given no data is set up', function() {
    afterEach(function() {
      DynamoDB.deleteItem(deleteParams(userIdNoData));
    });

    describe('AvailablePeopleIntent', function() {
      it('should return that no people are available', function(done) {
        var event = getEvent(userIdNoData, 'IntentRequest', 'AvailablePeopleIntent');
        var expected = '<speak> There are no people set up yet. </speak>';
        MyLambdaFunction['handler'](event, context(expected, done), done);
      });
    });

    describe('AddPersonIntent', function() {
      it('should add the person', function(done) {
        var slots = {
          'firstName': {
            'name': 'firstName',
            'value': 'Raid'
          }
        };
        var event = getEvent(userIdNoData, 'IntentRequest', 'AddPersonIntent', slots);
        var expected = '<speak> I added Raid to the list of available people. </speak>';
        MyLambdaFunction['handler'](event, context(expected, done), done);
      });
    });
  });


  describe('Given that data is available', function() {
    before(function() {
      var params = {
        'TableName': MyLambdaFunction.tableName,
        'Item': {
          'mapAttr': {
            'people': ['Raid', 'Dmytry']
          },
          'userId': userId
        }
      };
      DynamoDB.createItem(params);
    });


    after(function() {
      DynamoDB.deleteItem(deleteParams(userId));
    });

    describe('AvailablePeopleIntent', function() {
      it('should return list of available people', function(done) {
        var event = getEvent(userId, 'IntentRequest', 'AvailablePeopleIntent');
        var expected = '<speak> Available team members for Duty Roster are Raid and Dmytry </speak>';
        MyLambdaFunction['handler'](event, context(expected, done), done);
      });
    });

    describe('AddPersonIntent', function() {
      it('should say the person is already in the list', function(done) {
        var slots = {
          'firstName': {
            'name': 'firstName',
            'value': 'Raid'
          }
        };
        var event = getEvent(userId, 'IntentRequest', 'AddPersonIntent', slots);
        var expected = '<speak> Raid is already in the list. </speak>';
        MyLambdaFunction['handler'](event, context(expected, done), done);
      });
    });
  });

});
