var assert = require("assert");
var index = require("../src/index.js");
var MockDate = require("mockdate");


describe("DutyRoster Unit", function () {

    beforeEach(function () {
        MockDate.set("03/26/2017");
    });

    afterEach(function () {
        MockDate.reset();
    });

    describe("whoIsOnDuty()", function () {
        it("should tell if there are no people", function () {
            var name, week, people;
            assert.equal(index.whoIsOnDuty(name, week, people)[1], undefined);
            assert.equal(index.whoIsOnDuty(name, week, people)[0], "NO_PEOPLE");
        });
        it("should choose a person if no session info on name/week is available", function () {
            var name, week;
            var people = ["Cindy"];
            assert.equal(index.whoIsOnDuty(name, week, people)[0], "CHOSEN_PERSON");
            assert.equal(index.whoIsOnDuty(name, week, people)[1], "Cindy");
        });
        it("should choose a person if no one is set for this week", function () {
            var name = "Anna";
            var week = "2017-01"; // week in the past
            var people = ["Cindy"];
            assert.equal(index.whoIsOnDuty(name, week, people)[0], "CHOSEN_PERSON");
            assert.equal(index.whoIsOnDuty(name, week, people)[1], "Cindy");
        });
        it("should choose a person if week is unknown", function () {
            var name = "Anna";
            var week;
            var people = ["Cindy"];
            assert.equal(index.whoIsOnDuty(name, week, people)[0], "CHOSEN_PERSON");
            assert.equal(index.whoIsOnDuty(name, week, people)[1], "Cindy");
        });
        it("should tell the person which is set", function () {
            var name = "Cindy";
            var week = "2017-13";
            var people = ["Cindy"];
            assert.equal(index.whoIsOnDuty(name, week, people)[0], "DUTY_OFFICER");
            assert.equal(index.whoIsOnDuty(name, week, people)[1], "Cindy");
        });
    });

    describe("availablePeople()", function () {
        it("should return no people if no people are set up", function () {
            var people;
            assert.equal(index.availablePeople(people)[0], "NO_PEOPLE");
        });
        it("should return 1 person if only 1 is available", function () {
            var people = ["Cindy"];
            assert.equal(index.availablePeople(people)[0], "AVAILABLE_PERSON");
            assert.equal(index.availablePeople(people)[1], "Cindy");
        });
        it("should return all people that are available", function () {
            var people = ["Raid", "Cindy", "Anna"];
            assert.equal(index.availablePeople(people)[0], "AVAILABLE_PEOPLE");
            assert.equal(index.availablePeople(people)[1], "Raid, Cindy %s Anna");
        });
    });

    describe("shouldAddPerson", function () {
        it("should return true if the person is not in the list", function () {
            var firstName = "Cindy";
            var people = ["Anna"];
            assert.equal(index.shouldAddPerson(firstName, people), true);
        });
        it("should return true if no people are setup", function () {
            var firstName = "Cindy";
            var people;
            assert.equal(index.shouldAddPerson(firstName, people), true);
        });
        it("should return false if the person is already in the list", function () {
            var firstName = "Cindy";
            var people = ["Cindy", "Anna"];
            assert.equal(index.shouldAddPerson(firstName, people), false);
        });
    });


    describe("sayArray", function () {
        it("should say nothing for an empty list", function () {
            var data = [];
            assert.equal(index.sayArray(data, "and"), "");
        });
        it("should say the 1 thing that is in the list", function () {
            var data = ["Cindy"];
            assert.equal(index.sayArray(data, "and"), "Cindy");
        });
        it("should say join the 2 things in the list with the given join word", function () {
            var data = ["Cindy", "Anna"];
            assert.equal(index.sayArray(data, "and"), "Cindy and Anna");
            assert.equal(index.sayArray(data, "or"), "Cindy or Anna");
        });
        it("should say join the 3 things in the list with commans and the given join word", function () {
            var data = ["Cindy", "Anna", "Christian"];
            assert.equal(index.sayArray(data, "and"), "Cindy, Anna and Christian");
            assert.equal(index.sayArray(data, "or"), "Cindy, Anna or Christian");
        });
    });

});
