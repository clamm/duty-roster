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
      assert(getSpeech(data).indexOf(expected) > 0,
        'Got "' + getSpeech(data) + '" while "' + expected + '" was expected.');
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
var keyParams = function(id) {
  return {
    'TableName': MyLambdaFunction.tableName,
    'Key': {
      'userId': id
    }
  };
};
var itemParams = function functionName(id, name) {
  var params = {
    'TableName': MyLambdaFunction.tableName,
    'Item': {
      'mapAttr': {
        'people': ['Raid', 'Dmytry']
      },
      'userId': id
    }
  };
  if (name !== undefined) {
    params['Item']['mapAttr']['name'] = name;
  }
  return params;
};



// ------- actual test scenarios
describe('DutyRoster Integration', function() {

  describe('LaunchRequest', function() {
    it('should return a welcome text', function(done) {
      var event = getEvent(userId, 'LaunchRequest');
      var expected = 'Welcome';
      MyLambdaFunction['handler'](event, context(expected, done), done);
    });
  });


  describe('Given no data is set up', function() {
    afterEach(function(done) {
      DynamoDB.deleteItem(keyParams(userIdNoData), done);
    });

    describe('AvailablePeopleIntent', function() {
      it('should first return that no people are available', function(done) {
        var event = getEvent(userIdNoData, 'IntentRequest', 'AvailablePeopleIntent');
        var expected = 'There are no people set up yet';
        MyLambdaFunction['handler'](event, context(expected, done), done);
      });
    });

    describe('AnswerIntent', function() {
      it('should as well return that no people are available', function(done) {
        var event = getEvent(userIdNoData, 'IntentRequest', 'AnswerIntent');
        var expected = 'There are no people set up yet.';
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
        var expected = 'I added Raid to the list of available people.';
        MyLambdaFunction['handler'](event, context(expected, done), done);
      });
    });
  });


  describe('Given that data is available', function() {

    beforeEach(function(done) {
      DynamoDB.createItem(itemParams(userId), done);
    });

    afterEach(function(done) {
      DynamoDB.deleteItem(keyParams(userId), done);
    });

    describe('AvailablePeopleIntent', function() {
      it('AvailablePeopleIntent should return list of available people', function(done) {
        var event = getEvent(userId, 'IntentRequest', 'AvailablePeopleIntent');
        var expected = 'Available team members for Duty Roster are Raid and Dmytry';
        MyLambdaFunction['handler'](event, context(expected, done), done);
      });
    });

    describe('AnswerIntent', function() {
      it('AnswerIntent should choose a person', function(done) {
        var event = getEvent(userId, 'IntentRequest', 'AnswerIntent');
        var expected = 'I chose';
        MyLambdaFunction['handler'](event, context(expected, done), done);
      });
    });

    // use new block to overwrite beforeEach with named version
    describe('AnswerIntent', function() {
      beforeEach(function(done) {
        DynamoDB.createItem(itemParams(userId, 'Raid'), done);
      });
      it('AnswerIntent should stick to the choosen person', function(done) {
        var event = getEvent(userId, 'IntentRequest', 'AnswerIntent');
        var expected = 'Raid is the Duty Roster';
        MyLambdaFunction['handler'](event, context(expected, done), done);
      });
    });

    describe('AddPersonIntent', function() {
      it('AddPersonIntent should say the person is already in the list', function(done) {
        var slots = {
          'firstName': {
            'name': 'firstName',
            'value': 'Raid'
          }
        };
        var event = getEvent(userId, 'IntentRequest', 'AddPersonIntent', slots);
        var expected = 'Raid is already in the list.';
        MyLambdaFunction['handler'](event, context(expected, done), done);
      });
    });
  });

});
