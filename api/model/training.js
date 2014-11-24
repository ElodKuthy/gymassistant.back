(function () {
    "use strict";

    exports.ctor = Training;

    var moment = require("moment");

    var errors = require("./../common/errors.js");
    var roles = require("./../dal/roles.js");

    function Training(training) {
        this.id = training.id;
        this.parent = training.parent;
        this.name = training.name;
        this.coach = training.coach;
        this.current = training.current;
        this.max = training.max;
        this.date = training.date;

        var self = this;
        var attendees = training.attendees.slice();
        var participants = training.participants.slice();

        this.getAttendees = function(user) {
            return (!user || user.isCoach()) ? attendees : undefined;
        };

        this.getParticipants = function(user) {
            return (!user || user.isCoach()) ? participants : undefined;
        };

        this.isSignedUp = function (user) {
            return (attendees.indexOf(user.userName) > -1);
        };

        this.toData = function () {
            return {
                id: self.id,
                parent: self.parent,
                name: self.name,
                coach: self.coach,
                current: self.current,
                max: self.max,
                date: self.date,
                attendees: attendees,
                participants: participants,
            };
        };

        this.addAttendee = function (userName, checkTime) {

            if (checkTime && moment().isAfter(self.date, checkTime)) {
                return errors.trainingEnded();
            }

            if (self.isFull()) {
                return errors.trainingFull();
            }

            if (attendees.indexOf(userName) > -1) {
                return errors.alreadySignedUp();
            }

            if (userName === self.coach) {
                return errors.selfAttend();
            }

            attendees.push(userName);
            self.current++;
        };

        this.removeAttendee = function (userName, checkTime, tolerance) {

            if (tolerance && moment().add({days: tolerance}).isAfter(self.date)) {
                return errors.toLateToLeave();
            }

            if (checkTime && moment().isAfter(self.date), checkTime) {
                return errors.trainingEnded();
            }

            var attendeeIndex = attendees.indexOf(userName);

            if (attendeeIndex === -1) {
                return errors.notSignedUp();
            }

            var participantIndex = participants.indexOf(userName);

            if (participantIndex > -1) {
                participants.splice(participantIndex, 1);
            }

            attendees.splice(attendeeIndex, 1);
            self.current--;
        };

        this.addParticipant = function (userName, checkTime) {

            if (checkTime && moment().isAfter(self.date, checkTime)) {
                return Error.trainingEnded();
            }

            if (attendees.indexOf(userName) === -1) {
                return errors.notSignedUp();
            }

            if (participants.indexOf(userName) > -1) {
                return errors.alreadyCheckedIn();
            }

            participants.push(userName);
        };

        this.removeParticipant = function (userName, checkTime) {

            if (checkTime && moment().isAfter(self.date, checkTime)) {
                return Error.trainingEnded();
            }

            if (attendees.indexOf(userName) === -1) {
                return errors.notSignedUp();
            }

            var participantIndex = participants.indexOf(userName);

            if (participantIndex === -1) {
                return errors.notCheckedIn();
            }

            participants.splice(participantIndex, 1);
        };
    }

    Training.prototype.toJSON = function(user) {
        var attendees = this.getAttendees(user);
        var participants = this.getParticipants(user);
        var isSignedUp = this.isSignedUp(user);

        return {
            id: this.id,
            parent: this.parent,
            name: this.name,
            coach: this.coach,
            current: this.current,
            max: this.max,
            date: this.date,
            attendees: attendees,
            participants: participants,
            signedUp: isSignedUp
        };
    };

    Training.prototype.isFull = function() {
        return (this.current === this.max);
    };

})();