
(function () {

    "use strict";

    var express = require('express');
    var router = express.Router();

    exports.router = router;

    var logger = require("./common/log.js");
    var errors = require("./common/errors.js");
    var security = require("./security/security.js");
    var schedule = require("./dal/schedule.js");
    var attendees = require("./dal/attendees.js");
    var credits = require("./dal/credits.js");

    router.use(function(req, res, next) {

        logger.info(req.method + " " + req.originalUrl + " from: " + req.connection.remoteAddress);
        security.authenticate(req);

        next();
    });

    router.route("/login")

        .get(function(req, res) {

            if (req.user) {
                res.json(req.user);
            } else {
                res.json(errors.invalidUserNameOrPassword());
            }
        });

    /*router.route("/generate/:year")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "admin"))
                return;

            generateSchedule(req.param("year"));

            res.send({ result: "OK" });
        });

    function generateSchedule(year) {

        var result = {};

        var firstDate = moment({ year: year }).startOf("year");
        var lastDate = moment({ year: year }).endOf("year");

        result.schedule = [];

        trainings.forEach(function (training){

            training.dates.forEach(function (offset){

                for (var date = firstDate.clone().day(offset.day).hour(offset.hour);
                     date.isBefore(lastDate);
                     date.add({weeks: 1})) {

                    var instance = {
                        id: uuid.v4(),
                        parent: training.id,
                        name: training.name,
                        coach: training.coach,
                        current: training.attendees.length,
                        max: training.max,
                        date: date.clone(),
                        attendees: training.attendees.slice(),
                        participants: date.isBefore(moment(), "day") ?  training.attendees.slice() : []
                    };

                    var indexToInsert = 0;

                    while (result.schedule.length > indexToInsert &&
                        moment(result.schedule[indexToInsert].date).isBefore(instance.date))
                        indexToInsert++;

                    result.schedule.splice(indexToInsert, 0, instance);
                }
            });
        });

        jsonFile.writeFileSync(__dirname + "/data/schedule.json", result);

        return result;
    }*/

    router.route("/schedule")

        .get(function(req, res) {

            res.json(schedule.thisWeek(req.user));
        });


    router.route("/schedule/today")

        .get(function(req, res) {

            res.json(schedule.today(req.user));
        });

    router.route("/schedule/:id")

        .get(function(req, res) {

            if (security.checkCoach(req, res)) {

                var id = req.param("id");
                var training = schedule.findById(id);

                if (training) {
                    res.json(training.toJSON(req.user));
                } else {
                    res.json(errors.invalidTrainingId());
                }
            }
        });


    router.route("/schedule/:firstDate/:lastDate")

        .get(function(req, res) {

            var firstDate = req.param("firstDate");
            var lastDate = req.param("lastDate");

            res.json(schedule.fetch(firstDate, lastDate, req.user));

        });

    router.route("/join/session/:id")

        .get(function(req, res) {

            if (security.checkLoggedIn(req, res)) {

            var id = req.param("id");

            res.json(attendees.joinTraining(id, req.user));

            }
        });

    router.route("/add/user/:userName/session/:id")

        .get(function(req, res) {

            if (security.checkCoach(req, res)) {

                var id = req.param("id");
                var userName = req.param("userName");

                res.json(attendees.addToTraining(id, userName));
            }
        });

    router.route("/check/in/user/:userName/session/:id")

        .get(function(req, res) {

            if (security.checkCoach(req, res)) {

                var id = req.param("id");
                var userName = req.param("userName");

                res.json(attendees.checkIn(id, userName));
            }

        });

    router.route("/undo/check/in/user/:userName/session/:id")

        .get(function(req, res) {

            if (security.checkCoach(req, res)) {

                var id = req.param("id");
                var userName = req.param("userName");

                res.json(attendees.undoCheckIn(id, userName));
            }

        });

    router.route("/leave/session/:id")

        .get(function(req, res) {

            if (security.checkLoggedIn(req, res)) {

                var id = req.param("id");

                res.json(attendees.leaveTraininig(id, req.user));
            }
        });

    router.route("/remove/user/:userName/session/:id")

        .get(function(req, res) {

            if (security.checkCoach(req, res)) {

                var id = req.param("id");
                var userName = req.param("userName");

                res.json(attendees.removeFromTraining(id, userName));
            }
        });

    router.route("/my/credits")

        .get(function(req, res) {

            if (security.checkLoggedIn(req, res)) {

                res.json(req.user.credits);
            }
        });

    router.route("/credits/of/user/:userName")

        .get(function(req, res) {

            if (security.checkCoach(req, res)) {

                var userName = req.param("userName");
                var user = users.findByName(userName);

                if (user) {
                    res.json(user.credits);
                } else {
                    res.json(Errors.unknownUserName());
                }
            }
        });


    router.route("/credits/add/:credits/for/today/for/user/:userName")

        .get(function(req, res) {

            if (security.checkCoach(req, res)) {
                var credits = req.param("credits");
                var userName = req.param("userName");
                var coach = req.user.userName;
                var expiry = { day: 1 };

                res.json(credits.update(credits, userName, coach, expiry));
            }

        });

    router.route("/credits/add/:credits/for/month/for/user/:userName")

        .get(function(req, res) {

            if (security.checkCoach(req, res)) {
                var credits = req.param("credits");
                var userName = req.param("userName");
                var coach = req.user.userName;
                var expiry = { month: 1 };

                res.json(credits.update(credits, userName, coach, expiry));
            }

        });

    router.route("/credits/add/:credits/for/three/months/for/user/:userName")

        .get(function(req, res) {

            if (security.checkCoach(req, res)) {
                var credits = req.param("credits");
                var userName = req.param("userName");
                var coach = req.user.userName;
                var expiry = { month: 3 };

                res.json(credits.update(credits, userName, coach, expiry));
            }

        });

    router.route("/users")

        .get(function (req, res) {

            if (security.checkCoach(req, res)) {

                res.json(users.getAllUsers());
            }
        });


    router.route("/change/password")

        .post(function (req, res) {

            if(security.checkLoggedIn(req, res)) {

                var password = req.body.password;

                res.json(hashes.setHash(req.user, password));
            }
        });


    router.get("/", function(req, res) {
        res.json({ message: "GymAssistant REST API" });
    });

})();
