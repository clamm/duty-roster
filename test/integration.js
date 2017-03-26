var assert = require("assert");
var striptags = require("striptags");
var i18n = require("i18next");
var sprintf = require("i18next-sprintf-postprocessor");
var texts = require("../src/texts.js");
var DynamoDB = require("../src/dynamodb.js");
var MockDate = require("mockdate");

// assumes single Lambda function with exports.handler
var MyLambdaFunction = require("../src/index.js");

var THE_DATE = "03/26/2017";
var THE_WEEK = "2017-13";

function getSpeech(response) {
    var ssml = response["response"]["outputSpeech"]["ssml"];
    return striptags(ssml).trim();
}

var context = function (expected, done) {
    return {
        "succeed": function (data) {
            // console.log(JSON.stringify(data, null, "\t"));
            assert(getSpeech(data).indexOf(expected) >= 0,
                "Got '" + getSpeech(data) + "' while '" + expected + "' was expected.");
            done();
        },
        "fail": function (err) {
            console.log("context.fail occurred");
            console.log(JSON.stringify(err, null, "\t"));
            assert.fail();
        }
    };
};

function getEvent(userId, type, intent, slots) {
    var applicationId = "amzn1.ask.skill.1234";
    var sessionId = "SessionId.1234";

    var session = {
        "sessionId": sessionId,
        "application": {
            "applicationId": applicationId
        },
        "attributes": {},
        "user": {
            "userId": userId
        },
        "new": true
    };

    var request = {
        "type": type,
        "requestId": "request5678",
        "locale": "en-US"
    };

    if (intent !== undefined) {
        request["intent"] = {
            "name": intent
        };
    }

    if (slots !== undefined) {
        request["intent"]["slots"] = slots;
    }

    return {
        "session": session,
        "request": request,
        "version": "1.0"
    };
}

var userId = "node.tests";
var userIdNoData = userId + ".nodata";
var keyParams = function (id) {
    return {
        "TableName": MyLambdaFunction.TABLE_NAME,
        "Key": {
            "userId": id
        }
    };
};
var itemParams = function functionName(id, name, week) {
    var params = {
        "TableName": MyLambdaFunction.TABLE_NAME,
        "Item": {
            "mapAttr": {
                "people": ["Raid", "Dmytry"]
            },
            "userId": id
        }
    };
    if (name !== undefined) {
        params["Item"]["mapAttr"]["name"] = name;
    }
    if (week !== undefined) {
        params["Item"]["mapAttr"]["week"] = week;
    }
    return params;
};


// ------- actual test scenarios
describe("DutyRoster Integration", function () {
    before(function (done) {
        i18n.use(sprintf).init({
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            returnObjects: true,
            lng: "en",
            resources: texts
        });
        done();
    });

    describe("LaunchRequest", function () {
        it("should return a welcome text", function (done) {
            var event = getEvent(userId, "LaunchRequest");
            var expected = i18n.t("WELCOME_MESSAGE", i18n.t("SKILL_NAME"));
            MyLambdaFunction["handler"](event, context(expected, done), done);
        });
    });


    describe("Given no data is set up", function () {
        afterEach(function (done) {
            DynamoDB.deleteItem(keyParams(userIdNoData), done);
        });

        describe("AvailablePeopleIntent", function () {
            it("should first return that no people are available", function (done) {
                var event = getEvent(userIdNoData, "IntentRequest", "AvailablePeopleIntent");
                var expected = i18n.t("NO_PEOPLE");
                MyLambdaFunction["handler"](event, context(expected, done), done);
            });
        });

        describe("AnswerIntent", function () {
            it("should as well return that no people are available", function (done) {
                var event = getEvent(userIdNoData, "IntentRequest", "AnswerIntent");
                var expected = i18n.t("NO_PEOPLE");
                MyLambdaFunction["handler"](event, context(expected, done), done);
            });
        });

        describe("AddPersonIntent", function () {
            it("should add the person", function (done) {
                var slots = {
                    "firstName": {
                        "name": "firstName",
                        "value": "Raid"
                    }
                };
                var event = getEvent(userIdNoData, "IntentRequest", "AddPersonIntent", slots);
                var expected = "I added Raid to the list of available people.";
                MyLambdaFunction["handler"](event, context(expected, done), done);
            });
        });
    });


    describe("Given that data is available", function () {

        beforeEach(function (done) {
            DynamoDB.createItem(itemParams(userId), done);
        });

        afterEach(function (done) {
            DynamoDB.deleteItem(keyParams(userId), done);
        });

        describe("AvailablePeopleIntent", function () {
            it("should return list of available people", function (done) {
                var event = getEvent(userId, "IntentRequest", "AvailablePeopleIntent");
                var expected = "Raid and Dmytry";
                MyLambdaFunction["handler"](event, context(expected, done), done);
            });
        });

        describe("AnswerIntent", function () {
            it("should choose a person", function (done) {
                var event = getEvent(userId, "IntentRequest", "AnswerIntent");
                // we don't know the person that was chosen, but we know it should respond with this text
                var until = i18n.t("CHOSEN_PERSON").indexOf("%s");
                var expected = i18n.t("CHOSEN_PERSON").substr(0, until);
                MyLambdaFunction["handler"](event, context(expected, done), done);
            });
        });

        // use new block to overwrite beforeEach with named version
        describe("AnswerIntent", function () {
            beforeEach(function (done) {
                DynamoDB.createItem(itemParams(userId, "Raid", THE_WEEK), done);
            });
            it("should stick to the chosen person", function (done) {
                var event = getEvent(userId, "IntentRequest", "AnswerIntent");
                // we don't know the person that was chosen, but we know it should respond with this text
                var until = i18n.t("DUTY_OFFICER").indexOf("%s");
                var expected = i18n.t("DUTY_OFFICER").substr(until + 3);
                MockDate.set(new Date(THE_DATE));
                MyLambdaFunction["handler"](event, context(expected, done), done);
                MockDate.reset();
            });
        });

        describe("AnswerIntent", function () {
            beforeEach(function (done) {
                DynamoDB.createItem(itemParams(userId, "Raid", "2017-01"), done);
            });
            it("should choose a new person if it's a new week", function (done) {
                var event = getEvent(userId, "IntentRequest", "AnswerIntent");
                // we don't know the person that was chosen, but we know it should respond with this text
                var until = i18n.t("CHOSEN_PERSON").indexOf("%s");
                var expected = i18n.t("CHOSEN_PERSON").substr(until + 3);
                MyLambdaFunction["handler"](event, context(expected, done), done);
            });
        });

        describe("AddPersonIntent", function () {
            it("should say the person is already in the list", function (done) {
                var slots = {
                    "firstName": {
                        "name": "firstName",
                        "value": "Raid"
                    }
                };
                var event = getEvent(userId, "IntentRequest", "AddPersonIntent", slots);
                var expected = "Raid is already in the list.";
                MyLambdaFunction["handler"](event, context(expected, done), done);
            });
        });
    });

});
