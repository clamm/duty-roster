var Alexa = require('alexa-sdk');
var moment = require('moment');
var AWS = require('aws-sdk');
var AWSregion = 'eu-west-1';

exports.tableName = 'DutyRosterSessions';


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
    var people = this.attributes['people'];
    var currentName = this.attributes['name'];

    var results = exports.whoIsOnDuty(currentName, people);
    var msg = results[0];

    // save the chosen person
    var newName = results[1];
    if (newName !== undefined) {
      this.attributes['name'] = newName;
    }

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
    var msg = exports.availablePeople(people);
    this.emit(':tell', msg);
  },

  'AMAZON.HelpIntent': function() {
    this.emit(':ask', 'With Duty Roster you can find out who is the Duty Roster this week. Just say "Who is the duty roster this week?"');
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

exports.whoIsOnDuty = function(name, people) {
  var msg;
  if (name !== undefined) {
    msg = name + ' is the Duty Roster for this week.';
  } else if (name === undefined & noPeople(people)) {
    // TODO enchain a dialogue here to setup people
    msg = msgNoPeople;
  } else if (name === undefined & !noPeople(people)) {
    name = choosePerson(people);
    msg = 'I chose ' + name + ' as Duty Roster for this week.';
  }
  return [msg, name];
};

exports.availablePeople = function(people) {
  var msg;
  if (noPeople(people)) {
    msg = msgNoPeople;
  } else {
    // TODO fix grammar if only 1 person is available
    msg = 'Available team members for Duty Roster are ' + sayArray(people, 'and');
  }
  return msg;
};

function noPeople(people) {
  return people === undefined || people.length === 0;
}

var getCurrentWeek = function() {
  return moment().format('Y-ww');
};

function choosePerson(people) {
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
