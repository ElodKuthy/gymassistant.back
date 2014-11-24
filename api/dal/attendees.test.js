(function () {
    "use strict";
    /*jshint expr: true*/

    var should = require("should");
    var proxyquire = require("proxyquire");
    var a = require("a");

    var moment = require("moment");

    var errors = {};
    var schedule = {};
    var users = {};

    var Training = proxyquire("./../model/training.js",  { "./../common/errors.js": errors });
    var User = proxyquire("./../model/user.js",  { "./../common/errors.js": errors });
    var attendees = proxyquire("./attendees", { "./../common/errors.js": errors,
                                                "./schedule.js": schedule,
                                                "./users.js": users } );

    var defaultTraining = {
        id: 2,
        parent: 1,
        name: "Test Session",
        coach: "Test Coach",
        current: 4,
        max: 16,
        date: moment().add({ days: 1 }),
        attendees: [],
        participants: []
    };

    var defaultUser = {
        userName: "Sterling Archer",
        roles: [
            "client"
        ],
        credits: {
            free: 1
        }
    };


    describe("Attendee", function () {
        describe("join training", function () {
            describe("successfully", function () {

                var training = new Training.ctor(defaultTraining);
                var user = new User.ctor(defaultUser);

                var result;

                before(function () {
                    schedule.findById = a.mock();
                    schedule.findById.expect(training.id).return(training);
                    schedule.commit = a.mock();
                    schedule.commit.expect();
                    users.commit = a.mock();
                    users.commit.expect();

                    result = attendees.joinTraining(training.id, user);

                    schedule.findById.verify().should.be.ok;
                    schedule.commit.verify().should.be.ok;
                    users.commit.verify().should.be.ok;
                });

                it("should return proper result", function() {

                    result.should.be.equal("A felhasználó sikerersen feliratkozott az órára");
                });
                it("should add the user to the training", function() {

                    training.current.should.be.equal(5);
                    training.getAttendees().should.containEql(user.userName);
                });
                it("should remove a credit from the user", function() {

                    user.credits.free.should.be.equal(0);
                });
            });
            describe("possible errors", function () {

                var error = "Test error";
                var training, user;

                beforeEach(function () {
                    training = new Training.ctor(defaultTraining);
                    user = new User.ctor(defaultUser);

                    schedule.findById = a.mock();
                    schedule.findById.expect(training.id).return(training);
                });

                it("should check the training id", function () {

                    schedule.findById = a.mock();
                    schedule.findById.expect(training.id);
                    errors.invalidTrainingId = a.mock();
                    errors.invalidTrainingId.expect().return(error);

                    var result = attendees.joinTraining(training.id, user);

                    schedule.findById.verify().should.be.ok;
                    errors.invalidTrainingId.verify().should.be.ok;
                    result.should.be.equal(error);
                });

                it("should check that the user have free credit", function () {

                    user.credits.free = 0;

                    errors.noCredit = a.mock();
                    errors.noCredit.expect().return(error);

                    var result = attendees.joinTraining(training.id, user);

                    schedule.findById.verify().should.be.ok;
                    errors.noCredit.verify().should.be.ok;
                    result.should.be.equal(error);
                });

                it("should check that the training is full", function () {

                    training.current = training.max;

                    errors.trainingFull = a.mock();
                    errors.trainingFull.expect().return(error);
                    users.rollback = a.mock();
                    users.rollback.expect();

                    var result = attendees.joinTraining(training.id, user);

                    schedule.findById.verify().should.be.ok;
                    errors.trainingFull.verify().should.be.ok;
                    users.rollback.verify().should.be.ok;
                    result.should.be.equal(error);
                });

                it("should check that the training is already over", function () {

                    training.date = moment().subtract( { days: 1 } );

                    errors.trainingEnded = a.mock();
                    errors.trainingEnded.expect().return(error);
                    users.rollback = a.mock();
                    users.rollback.expect();

                    var result = attendees.joinTraining(training.id, user);

                    schedule.findById.verify().should.be.ok;
                    errors.trainingFull.verify().should.be.ok;
                    users.rollback.verify().should.be.ok;
                    result.should.be.equal(error);
                });

                it("should check that the user already signed up for the training", function () {

                    user.credits.free = 2;

                    schedule.findById = a.mock();
                    schedule.findById.expect(training.id).return(training).repeat(2);
                    schedule.commit = a.mock();
                    schedule.commit.expect();
                    users.commit = a.mock();
                    users.commit.expect();
                    errors.alreadySignedUp = a.mock();
                    errors.alreadySignedUp.expect().return(error);
                    users.rollback = a.mock();
                    users.rollback.expect();

                    var result = attendees.joinTraining(training.id, user);
                    result = attendees.joinTraining(training.id, user);

                    schedule.findById.verify().should.be.ok;
                    errors.trainingFull.verify().should.be.ok;
                    schedule.commit.verify().should.be.ok;
                    users.commit.verify().should.be.ok;
                    users.rollback.verify().should.be.ok;
                    result.should.be.equal(error);
                });

                it("should check that the coach trying to join his/her own training", function () {

                    user.userName = training.coach;

                    errors.selfAttend = a.mock();
                    errors.selfAttend.expect().return(error);
                    users.rollback = a.mock();
                    users.rollback.expect();

                    var result = attendees.joinTraining(training.id, user);

                    schedule.findById.verify().should.be.ok;
                    errors.trainingFull.verify().should.be.ok;
                    users.rollback.verify().should.be.ok;
                    result.should.be.equal(error);
                });
            });
        });
    });
})();