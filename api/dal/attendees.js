(function () {
    "use strict";

    exports.addToTraining = addToTraining;
    exports.joinTraining = joinTraining;
    exports.leaveTraining = leaveTraining;
    exports.removeFromTraining = removeFromTraining;
    exports.checkIn = checkIn;
    exports.undoCheckIn = undoCheckIn;

    var moment = require("moment");

    var errors = require("./../common/errors.js");
    var schedule = require("./schedule.js");
    var users = require("./users.js");

    function add(training, user, checkTime) {

        var error;

        error = user.removeCredits();

        if (error) {
            return error;
        }

        error = training.addAttendee(user.userName, checkTime);

        if (error) {
            users.rollback();
            return error;
        }

        schedule.commit();
        users.commit();

        return "A felhasználó sikerersen feliratkozott az órára";
    }

    function joinTraining(trainingId, user) {

        var training = schedule.findById(trainingId);

        if (!training) {
            return errors.invalidTrainingId();
        }

        return add(training, user, "hour");
    }

    function addToTraining(trainingId, userName) {

        var training = schedule.findById(trainingId);

        if (!training) {
            return errors.invalidTrainingId();
        }

        var user = users.findByName(userName);

        if (!user) {
            return errors.unknownUserName();
        }

        return add(training, user);
    }

    function remove(training, user, checkTime, tolerance) {

        var error;

        error = training.removeAttendee(user.userName, checkTime, tolerance);

        if (error) {
            return error;
        }

        user.addCredits();

        schedule.commit();
        users.commit();

        return "A felhasználó sikeresen lemondta az órát";
    }

    function leaveTraining(trainingId, user) {

        var training = schedule.findById(id);

        if (!training) {
            return errors.invalidTrainingId();
        }

        return remove(training, user, "hour", 1);
    }

    function removeFromTraining(trainingId, userName) {

        var training = schedule.findById(trainingId);

        if (!training) {
            return errors.invalidTrainingId();
        }

        var user = users.findByName(userName);

        if (!user) {
            return errors.unknownUserName();
        }

        return remove(training, user);
    }

    function checkIn(trainingId, userName) {

        var training = schedule.findById(trainingId);

        if (!training) {
            return errors.invalidTrainingId();
        }

        var error = training.addParticipant(userName, "hour");

        if (error) {
            return error;
        }

        schedule.commit();

        return "A felhasználó sikeresen bejelenkezett az órára";
    }

    function undoCheckIn(trainingId, userName) {

        var training = schedule.findById(trainingId);

        if (!training) {
            return errors.invalidTrainingId();
        }

        var error = training.removeParticipant(userName, true);

        if (error) {
            return error;
        }

        schedule.commit();

        return "A felhasználó bejelenkezése sikeresen visszavonva";
    }

})();