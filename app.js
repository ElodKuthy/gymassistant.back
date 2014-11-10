"use strict";

(function () {

    var express = require("express");
    var app = express();
    var bodyParser = require("body-parser");
    var crypto = require("crypto");
    var moment = require("moment");
    var favicon = require("serve-favicon");
    var jsonFile = require("jsonfile");
    var util = require("util");
    var uuid = require("node-uuid");
    var fs = require("fs");
    var validator = require('validator');

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.use(favicon(__dirname + "/public/favicon.ico"));

    var port = process.env.PORT || 9000;

    var router = express.Router();

    var users = jsonFile.readFileSync(__dirname + "/data/users.json").users;
    var hashes = jsonFile.readFileSync(__dirname + "/data/hashes.json").hashes;
    var trainings = jsonFile.readFileSync(__dirname + "/data/trainings.json").trainings;
    var schedule = jsonFile.readFileSync(__dirname + "/data/schedule.json").schedule;

    router.use(function(req, res, next) {

        console.log(moment().format() + " " + req.method + " " + req.originalUrl);
        authenticate(req);
        console.log(req.authenticated ? ("Authenticated as " + req.authenticatedAs.userName) : ("Not authenticated"));

        next();
    });

    var isCoach = false;

    function findUser(userName, checkEmail) {
        for (var index = 0; index < users.length; index++) {
            var current = users[index];
            if (current.userName === userName || (checkEmail && current.email === userName)) {
                return current;
            }
        }
    }

    function checkHash(user, hash) {
        for (var index = 0; user && index < hashes.length; index++){
            var current = hashes[index];
            if (current.userName === user.userName && current.hash === hash) {
                return true;
            }
        }
        return false;
    }

    function setHash(user, hash) {
        for (var index = 0; user && index < hashes.length; index++){
            var current = hashes[index];
            if (current.userName === user.userName) {
                current.hash = hash;
                return true;
            }
        }
        return false;
    }

    function authenticate(req) {

        req.authenticated = false;
        req.authenticatedAs = null;
        isCoach = false;
        var authorizationHeader = req.headers["authorization"];

        try {

            var base64 = authorizationHeader.replace("Basic ", "");
            base64 = new Buffer(base64, "base64");
            var userNameAndPassword = base64.toString("utf8");
            console.log(userNameAndPassword);
            userNameAndPassword = userNameAndPassword.split(":");
            var userName = userNameAndPassword[0];
            var password = userNameAndPassword[1];
            var sha512 = crypto.createHash("sha512");
            sha512.update(password, "utf8");
            var hash = sha512.digest(password);
            var hashBase64 = hash.toString("base64");

            var user = findUser(userName, true);

            if (checkHash(user, hashBase64)) {
                req.authenticated = true;
                req.authenticatedAs = user;
                isCoach = (user.roles.indexOf("coach") > -1);
            }

        } catch (error) {
            req.authenticated = false;
            req.authenticatedAs = null;
        }
    }

    router.route("/login")

        .get(function(req, res) {

            var result = {};

            if (req.authenticated) {

                result.userInfo = req.authenticatedAs;
            } else {
                result.error = {
                    message : "Hibás felhasználónév vagy jelszó"
                };
            }

            res.json(result);
        });

    router.route("/generate/:year")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "admin"))
                return;

            generateSchedule(req.param("year"));

            res.send("OK");
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

                    while (result.schedule.length > indexToInsert
                            && moment(result.schedule[indexToInsert].date).isBefore(instance.date))
                        indexToInsert++;

                    result.schedule.splice(indexToInsert, 0, instance);
                }
            });
        });

        jsonFile.writeFileSync(__dirname + "/data/schedule.json", result);

        return result;
    }

    function fetchSchedule(startDate, endDate, user) {

        var result = {};

        result.dates = {
            begin: startDate,
            end: endDate
        };

        result.schedule = [];

        var index = 0;
        while (moment(schedule[index].date).isBefore(startDate) && index < schedule.length) {
            index++;
        }

        for (var current = schedule[index];
             moment(current.date).isBefore(endDate) && index < schedule.length;
             current = schedule[++index]) {

            var instance = {
                id: current.id,
                parent: current.parent,
                name: current.name,
                coach: current.coach,
                current: current.attendees.length,
                max: current.max,
                date: current.date,
                attendees: isCoach ? current.attendees : undefined,
                participants: isCoach ? current.participants : undefined,
                signedUp: user ? (current.attendees.indexOf(user.userName) > -1) : false
            };

            result.schedule.push(instance);
        }

        return result;
    }

    function thisWeek() {
        var result = [];

        result.push(moment().startOf("week").add({ days: 1 }));
        result.push(moment().startOf("week").add({ days: 7 }));

        return result;
    }

    function saveSchedule() {
        var data = {};
        data.schedule = schedule;
        jsonFile.writeFileSync(__dirname + "/data/schedule.json", data);
    }

    function saveUsers() {
        var data = {};
        data.users = users;
        jsonFile.writeFileSync(__dirname + "/data/users.json", data);
    }

    function saveHashes() {
        var data = {};
        data.hashes = hashes;
        jsonFile.writeFileSync(__dirname + "/data/hashes.json", data);
    }

    function findInstance(id) {
        for (var index = 0; index < schedule.length; index++) {
            if (schedule[index].id === id) {
                return index;
            }
        }
    }

    router.route("/schedule")

        .get(function(req, res) {

            var dates = thisWeek();
            var result = fetchSchedule(dates[0], dates[1], req.authenticatedAs);

            res.json(result);
        });

    router.route("/schedule/:id")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "coach"))
                return;

            var result = {};
            var id = req.param("id");

            var index = findInstance(id);

            if (!index) {
                res.send({ error: "Id is not valid" });
                return;
            }

            var current = schedule[index];

            result.instance = {
                id: current.id,
                parent: current.parent,
                name: current.name,
                coach: current.coach,
                current: current.attendees.length,
                max: current.max,
                date: current.date,
                attendees: current.attendees,
                participants: current.participants
            };

            res.json(result);
        });


    router.route("/schedule/:firstDate/:lastDate")

        .get(function(req, res) {

            var firstDate = moment(req.param("firstDate"));
            var lastDate = moment(req.param("lastDate"));

            var result = fetchSchedule(firstDate, lastDate, req.authenticatedAs);

            res.json(result);
        });

    function addToTrainingSession(id, userName, tolerance) {

        var index = findInstance(id);

        if (!index) {
            return { error: "Invalid training session id" };
        }

        var instance = schedule[index];

        if (moment().isAfter(instance.date, tolerance)) {
            return { error: "Training session is in the past" };
        }

        if (instance.current === instance.max) {
            return { error: "Training session is full" };
        }

        var user = findUser(userName);

        if (!user) {
            return { error: "Invalid user name" };
        }

        if (instance.attendees.indexOf(userName) > -1) {
            return { error: "Already signed up" };
        }

        if (user.credits < 1) {
            return { error: "No free credit" };
        }

        instance.attendees.push(user.userName);
        instance.current++;
        user.credits--;
        saveSchedule();
        saveUsers();
        return "Successfully joined to training session";
    }

    router.route("/join/session/:id")

        .get(function(req, res) {

            if (!checkAuthentication(req, res))
                return;

            var id = req.param("id");

            res.send(addToTrainingSession(id, req.authenticatedAs.userName));

        });

    router.route("/add/user/:userName/session/:id")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "coach"))
                return;

            var id = req.param("id");
            var userName = req.param("userName");

            res.send(addToTrainingSession(id, userName, "day"));

        });

    function removeFromTrainingSession(id, userName, daysBeforeCanLeave, tolerance) {

        var index = findInstance(id);

        if (!index) {
            return { error: "Invalid training session id" };
        }

        var instance = schedule[index];

        if (moment().isAfter(instance.date, tolerance)) {
            return { error: "Training session is in the past"};
        }

        var latestLeaveTime = moment().add({days: daysBeforeCanLeave});

        if (latestLeaveTime.isAfter(instance.date, tolerance)) {
            return { error: "To close to the actual date to leave"};
        }

        var user = findUser(userName);

        if (!user) {
            return { error: "Invalid user name" };
        }

        var userIndex = instance.attendees.indexOf(userName);

        if (userIndex === -1) {
            return { error: "User hasn't signed up for that session"};
        }

        instance.attendees.splice(userIndex, 1);
        instance.current--;
        user.credits++;
        saveSchedule();
        saveUsers();

        return "Successfully left the training session";
    }

    router.route("/leave/session/:id")

        .get(function(req, res) {

            if (!checkAuthentication(req, res))
                return;

            var id = req.param("id");

            res.send(removeFromTrainingSession(id, req.authenticatedAs.userName, 1));
        });

    router.route("/remove/user/:userName/session/:id")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "coach"))
                return;

            var id = req.param("id");
            var userName = req.param("userName");

            res.send(removeFromTrainingSession(id, userName, 0, "day"));
        });

    function checkAuthentication(req, res, role) {

        if (!req.authenticated || (role && req.authenticatedAs.roles.indexOf(role) === -1)) {
            res.send({ error: "Unauthorized"});
        }

        return true;
    }

    router.route("/credits")

        .get(function(req, res) {

            if (!checkAuthentication(req, res))
                return;

            var data = {};
            data.credits = req.authenticatedAs.credits;

            res.json(data);
        });

    router.route("/credits/add/:credits/user/:userName")

        .get(function(req, res) {

            if (checkAuthentication(req, res, "coach"))
                return;

            var creditsToAdd = NaN;

            if (validator.isInt(req.param("credits"))) {
                creditsToAdd = parseInt(req.param("credits"));
            }

            if (isNaN(creditsToAdd) || creditsToAdd < 1) {
                res.send({ error: "Credits to add should be a positive integer"});
                return;
            }

            var userName = req.param("userName");

            var user = findUser(userName);

            if(!user) {
                res.send({ error: "Invalid user name"});
                return;
            }

            user.credits += creditsToAdd;

            saveUsers();

            res.send("Credits added successfully");

        });

    router.route("/users")
        
        .get(function (req, res) {

            if (!checkAuthentication(req, res, "coach"))
                return;

            var result = {};
            result.users = users;

            res.json(result);
        });


    router.route("/password")

        .post(function (req, res) {

            if(!checkAuthentication(req, res))
                return;

            var password = req.body.password;

            console.log(req.authenticatedAs.userName);
            console.log(password);

            var sha512 = crypto.createHash("sha512");
            sha512.update(password, "utf8");
            var hash = sha512.digest(password);
            var hashBase64 = hash.toString("base64");
            console.log(hashBase64);


            if (setHash(req.authenticatedAs, hashBase64)) {
                saveHashes();
                res.send("A jelszó sikeresen meg lett változtatva");
            } else {
                res.send({error: "Nem sikerült megváltoztatni a jelszót"})
            }
        });


    router.get("/", function(req, res) {
        res.json({ message: "GymAssistant REST API" });
    });

    app.use("/api", router);

    app.listen(port);
    console.log("Server running at port " + port);

})();
