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

        console.log(req.method + " " + req.originalUrl);
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

    function generateSchedule() {

        var result = {};

        var firstDate = moment().startOf("year");
        var lastDate = moment().endOf("year").add({years: 1});

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
                        attendess: training.attendees
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

    function fetchSchedule(startDate, endDate) {

        var result = [];

        var index = 0;
        while (moment(schedule[index].date).isBefore(startDate) && index < schedule.length) {
            index++;
        }

        for (var current = schedule[index];moment(current.date).isBefore(endDate) && index < schedule.length; current = schedule[++index]) {

            var instance = {
                id: current.id,
                parent: current.parent,
                name: current.name,
                coach: current.coach,
                current: current.attendees.length,
                max: current.max,
                date: current.date,
                attendees: isCoach ? current.attendees : undefined
            };

            result.push(instance);
        }

        return result;
    }

    function thisWeek() {
        var result = [];

        result.push(moment().startOf("week").add({ days: 1 }));
        result.push(moment().startOf("week").add({ days: 6 }));

        return result;
    }

    function updateSchedule(updated) {

        var updatedInstance = JSON.parse(updated);

        var index = findInstance(updatedInstance.id);

        if (index) {
            schedule[index] = updatedInstance;
            saveSchedule();
        }
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

    function findInstance(id) {
        for (var index = 0; index < schedule.length; index++) {
            if (schedule[index].id === id) {
                return index;
            }
        }
    }

    router.route("/schedule")

        .get(function(req, res) {

            var result = {};
            result.schedule = fetchSchedule.apply(this, thisWeek());

            res.json(result);
        })

        .post(function(req, res) {

            checkAuthentication(req, res, "coach");

            updateSchedule(req.body.schedule);

            res.json({message: "Schedule updated"});

        });

    router.route("/schedule/:day")

        .get(function(req, res) {

            var result = {};
            var firstDate = moment(req.param("day"));
            var lastDate = firstDate.clone().add({days: 1});

            result.schedule = fetchSchedule(firstDate, lastDate);

            res.json(result);
        });


    router.route("/schedule/:firstDate/:lastDate")

        .get(function(req, res) {

            var result = {};
            var firstDate = moment(req.param("firstDate"));
            var lastDate = moment(req.param("lastDate"));

            result.schedule = fetchSchedule(firstDate, lastDate);

            res.json(result);
        });

    router.route("/join/:id")

        .get(function(req, res) {

            checkAuthentication(req, res);

            var id = req.param("id");
            var index = findInstance(id);

            if (!index) {
                res.send("Invalid training session id");
            }

            var user = req.authenticatedAs;
            var instance = schedule[index];
            var now = moment();

            if (moment(instance.date).isBefore(now)) {
                res.send("Training session is in the past");
            }

            if (instance.current === instance.max) {
                res.send("Training session is full");
            }

            if (instance.attendees.indexOf(user.userName) > -1) {
                res.send("Already signed up");
            }

            if (user.credits < 1) {
                res.send("No free credit");
            }

            instance.attendees.push(user.userName);
            instance.current++;
            user.credits--;
            saveSchedule();
            saveUsers();
            res.send("Successfully joined to training session");

        });

    router.route("/leave/:id")

        .get(function(req, res) {

            checkAuthentication(req, res);

            var id = req.param("id");
            var index = findInstance(id);

            if (!index) {
                res.send("Invalid training session id");
            }

            var user = req.authenticatedAs;
            var instance = schedule[index];
            var now = moment();
            var latestLeaveTime = moment().add({days: 1});

            if (moment(instance.date).isBefore(now)) {
                res.send("Training session is in the past");
            }

            if (moment(instance.date).isBefore(latestLeaveTime)) {
                res.send("To close to the actual date to leave");
            }

            var userIndex = instance.attendees.indexOf(user.userName);

            if (userIndex === -1) {
                res.send("User hasn't signed up for that session");
            }

            instance.attendees.splice(userIndex, 1);
            instance.current--;
            user.credits++;
            saveSchedule();
            saveUsers();
            res.send("Successfully left the training session");
        });

    function checkAuthentication(req, res, role) {

        if (!req.authenticated || (role && req.authenticatedAs.roles.indexOf() > -1)) {
            res.send("Unauthorized");
        }
    }

    router.route("/credits")

        .get(function(req, res) {

            checkAuthentication(req, res);

            var data = {};
            data.credits = req.authenticatedAs.credits;

            res.json(data);
        });

    router.get("/", function(req, res) {
        res.json({ message: "GymAssistant REST API" });
    });

    app.use("/api", router);

    app.listen(port);
    console.log("Server running at port " + port);

})();
