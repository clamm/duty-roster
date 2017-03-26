var Alexa = require("alexa-sdk");
var moment = require("moment");
var AWS = require("aws-sdk");
AWS.config.update({
    region: "eu-west-1"
});

var APP_ID = undefined; // TODO replace with your app ID (OPTIONAL).

var texts = require("./texts");

exports.TABLE_NAME = "DutyRosterSessions";


exports.handler = function (event, context) {
    var alexa = Alexa.handler(event, context);

    alexa.appId = APP_ID;

    // creates new table for session.attributes
    alexa.dynamoDBTableName = exports.TABLE_NAME;

    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = texts;

    alexa.registerHandlers(handlers);
    return alexa.execute();
};

var handlers = {
    "LaunchRequest": function () {
        this.attributes["speechOutput"] = this.t("WELCOME_MESSAGE", this.t("SKILL_NAME"));
        this.attributes["repromptSpeech"] = this.t("WELCOME_REPROMPT");
        this.emit(":ask", this.attributes["speechOutput"], this.attributes["repromptSpeech"]);
        // TODO ask if user would like to know who is on duty - if people are setup (YesNoIntent)
    },

    "AnswerIntent": function () {
        var people = this.attributes["people"];
        var currentName = this.attributes["name"];
        var week = this.attributes["week"];

        var results = exports.whoIsOnDuty(currentName, week, people);
        var msgKey = results[0];

        // save the chosen person
        var newName = results[1];
        if (newName !== undefined) {
            this.attributes["name"] = newName;
            this.attributes["week"] = getCurrentWeek();
        }
        this.attributes["speechOutput"] = this.t(msgKey, newName);
        this.emit(":tell", this.attributes["speechOutput"]);
    },

    "AddPersonIntent": function () {
        var firstName = this.event.request.intent.slots.firstName.value;

        var people = this.attributes["people"];

        var msgKey = "ALREADY_IN_LIST";
        var shouldAdd = exports.shouldAddPerson(firstName, people);

        if (shouldAdd) {
            if (people) {
                this.attributes["people"].push(firstName);
            } else {
                this.attributes["people"] = [firstName];
            }
            msgKey = "ADDED_PERSON";
        }

        this.attributes["speechOutput"] = this.t(msgKey, firstName);
        this.emit(":tell", this.attributes["speechOutput"]);
    },

    "AvailablePeopleIntent": function () {
        var people = this.attributes["people"];
        var results = exports.availablePeople(people);
        var msgKey = results[0];
        var names = results[1];
        this.attributes["speechOutput"] = this.t(msgKey, this.t(names, this.t("AND")));
        this.emit(":tell", this.attributes["speechOutput"]);
    },

    "AMAZON.HelpIntent": function () {
        this.emit(":ask", "With Duty Roster you can find out who is the Duty Roster this week. Just say 'Who is the duty roster this week?'");
    },

    "AMAZON.StopIntent": function () {
        this.emit(":tell", "Bye, see you soon.");
    },

    "AMAZON.CancelIntent": function () {
        this.emit(":tell", "Later dude.");
    }
};


exports.whoIsOnDuty = function (name, week, people) {
    var msgKey;

    // if officer is not set
    var officerIsSet = name !== undefined;
    var officerOutdated = name && week !== getCurrentWeek();

    if (!officerIsSet || officerOutdated) {
        var results = choosePerson(people);
        msgKey = results[0];
        name = results[1];
    } else {
        // officer is set and up to date
        msgKey = "DUTY_OFFICER";
    }
    return [msgKey, name];
};

exports.availablePeople = function (people) {
    var msgKey;
    if (!people) {
        msgKey = "NO_PEOPLE";
    } else {
        msgKey = "AVAILABLE_PEOPLE";
        // use sprintf style parameter which will be replaced with language specific word
        var names = exports.sayArray(people, "%s");
        if (people.length === 1) {
            msgKey = "AVAILABLE_PERSON";
        }
    }
    return [msgKey, names];
};

exports.shouldAddPerson = function (firstName, people) {
    if (people === undefined) {
        people = [];
    }
    var shouldAdd = false;
    if (people.indexOf(firstName) < 0) {
        shouldAdd = true;
    }
    return shouldAdd;
};

function getCurrentWeek() {
    return moment().format("Y-ww");
}

function choosePerson(people) {
    var name, msgKey;

    if (people) {
        name = randomlySelectPerson(people);
        msgKey = "CHOSEN_PERSON";
    }

    if (!people) {
        // TODO enchain a dialogue here to setup people
        msgKey = "NO_PEOPLE";
    }

    return [msgKey, name];
}

function randomlySelectPerson(people) {
    var i = 0;
    if (people === undefined) {
        return;
    }
    i = Math.floor(Math.random() * people.length);
    return people[i];
}

exports.sayArray = function (myData, andor) {
    // the first argument is an array [] of items
    // the second argument is the list penultimate word; and/or/nor etc.

    var listString = "";

    if (myData.length === 1) {
        listString = myData[0];
    } else {
        if (myData.length === 2) {
            listString = myData[0] + " " + andor + " " + myData[1];
        } else {
            for (var i = 0; i < myData.length; i++) {
                if (i < myData.length - 2) {
                    listString = listString + myData[i] + ", ";
                }
                else {
                    if (i === myData.length - 2) {
                        listString = listString + myData[i] + " " + andor + " ";
                    } else {
                        listString = listString + myData[i];
                    }
                }

            }
        }
    }
    return (listString);
};
