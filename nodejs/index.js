var Alexa = require('alexa-sdk');
var moment = require('moment');
var AWS = require('aws-sdk');
var AWSregion = 'eu-west-1';

exports.tableName = 'DutyRoasterSessions';


AWS.config.update({
  region: AWSregion
});

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);

  // alexa.appId = 'amzn1.ask.skill.1234';

  // creates new table for session.attributes
  alexa.dynamoDBTableName = exports.tableName;

  alexa.registerHandlers(handlers);
  return alexa.execute();
};

var msgNoPeople = 'There are no people set up yet.';

var handlers = {
  'LaunchRequest': function() {
    var welcomeText = exports.welcome();
    this.emit(':tell', welcomeText);
  },

  'AnswerIntent': function() {
    var attributes = this.attributes;

    var msg = exports.whoIsOnDuty(attributes);
    this.emit(':tell', msg);
  },

  'AddPersonIntent': function() {
    var firstName = this.event.request.intent.slots.firstName.value;

    var people = this.attributes['people'];

    if (people === undefined) {
      people = [];
    }

    var msg;
    if (people.indexOf(firstName) < 0) {
      people.push(firstName);
      this.attributes['people'] = people;
      msg = 'I added ' + firstName + ' to the list of available people.';
    } else {
      msg = firstName + ' is already in the list.';
    }

    this.emit(':tell', msg);
  },

  'AvailablePeopleIntent': function() {
    var people = this.attributes['people'];
    var msg;
    if (people === undefined || people.length === 0) {
      msg = msgNoPeople;
    } else {
      msg = 'Available team members for Duty Roaster are ' + sayArray(people, 'and');
    }

    this.emit(':tell', msg);
  },

  'AMAZON.HelpIntent': function() {
    this.emit(':ask', 'With Duty Roaster you can find out who is the Duty Roaster this week. Just say "Who is the duty roaster this week?"');
  },

  'AMAZON.StopIntent': function() {
    this.emit(':tell', 'Bye, see you soon.');
  },

  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Later dude.');
  },
};

exports.welcome = function() {
  return 'Welcome!';
};

exports.whoIsOnDuty = function(attributes) {
  var week = attributes['week'];
  var name = attributes['name'];
  var people = attributes['people'];

  // console.log('week: ' + week);
  // console.log('people:');
  // console.log(people);

  if (week !== getCurrentWeek()) {
    this.attributes['week'] = getCurrentWeek();
    name = getDutyRoaster(people);
  }

  console.log('name: ' + name);
  var msg;
  if (name !== undefined) {
    this.attributes['name'] = name;
    msg = name + ' is the Duty Roaster for this week.';
    return msg;
  } else {
    // TODO enchain a dialogue here
    msg = msgNoPeople;
    return msg;
  }
};

var getCurrentWeek = function() {
  return moment().format('Y-ww');
};

function getDutyRoaster(people) {
  var i = 0;
  if (people === undefined) {
    return;
  }
  i = Math.floor(Math.random() * people.length);
  return people[i];
}


function sayArray(myData, andor) {
  // the first argument is an array [] of items
  // the second argument is the list penultimate word; and/or/nor etc.

  var listString = '';

  if (myData.length == 1) {
    listString = myData[0];
  } else {
    if (myData.length == 2) {
      listString = myData[0] + ' ' + andor + ' ' + myData[1];
    } else {

      for (var i = 0; i < myData.length; i++) {
        if (i < myData.length - 2) {
          listString = listString + myData[i] + ', ';
          if (i == myData.length - 2) {
            listString = listString + myData[i] + ', ' + andor + ' ';
          }

        } else {
          listString = listString + myData[i];
        }

      }
    }
  }
  return (listString);
}
