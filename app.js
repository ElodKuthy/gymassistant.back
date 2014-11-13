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
    var validator = require("validator");
    var https = require("https");

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.use(favicon(__dirname + "/public/favicon.ico"));

    var port = process.env.PORT || 9000;

    var router = express.Router();

    var users = jsonFile.readFileSync(__dirname + "/data/users.json").users;
    var hashes = jsonFile.readFileSync(__dirname + "/data/hashes.json").hashes;
    var trainings = jsonFile.readFileSync(__dirname + "/data/trainings.json").trainings;
    var schedule = jsonFile.readFileSync(__dirname + "/data/schedule.json").schedule;

    var options = {
        key: fs.readFileSync(__dirname + "/ssl/key.pem"),
        cert: fs.readFileSync(__dirname + "/ssl/cert.pem"),
    };

    router.use(function(req, res, next) {

        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

        console.log(moment().format() + ": " + req.method + " " +  req.connection.remoteAddress + " " + req.originalUrl);
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

                result.result = "OK";
                result.userInfo = req.authenticatedAs;
            } else {
                result.error = "Hibás felhasználónév vagy jelszó";
            }

            res.json(result);
        });

    router.route("/generate/:year")

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

    function thisDay() {
        var result = [];

        result.push(moment().startOf("day"));
        result.push(moment().startOf("day").add({ days: 1 }));

        result.result = "OK";
        return result;
    }

    router.route("/schedule/today")

        .get(function(req, res) {

            var dates = thisDay();
            var result = fetchSchedule(dates[0], dates[1], req.authenticatedAs);

            result.result = "OK";
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
                res.send({ error: "Hibás edzés azonosító" });
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

            result.result = "OK";
            res.json(result);
        });


    router.route("/schedule/:firstDate/:lastDate")

        .get(function(req, res) {

            var firstDate = moment(req.param("firstDate"));
            var lastDate = moment(req.param("lastDate"));

            var result = fetchSchedule(firstDate, lastDate, req.authenticatedAs);

            result.result = "OK";
            res.json(result);
        });

    function addToTrainingSession(id, userName, tolerance) {

        var index = findInstance(id);

        if (!index) {
            return { error: "Hibás edzés azonosító" };
        }

        var instance = schedule[index];

        if (moment().isAfter(instance.date, tolerance)) {
            return { error: "Ez az óra már véget ért" };
        }

        if (instance.current === instance.max) {
            return { error: "Ez az edzés már megtelt" };
        }

        var user = findUser(userName);

        if (!user) {
            return { error: "Nincs ilyen nevű felhasználó" };
        }

        if (instance.attendees.indexOf(userName) > -1) {
            return { error: "A felhasználó már feliratkozott" };
        }

        if (user.credits < 1) {
            return { error: "A felhasználónak nincs több szabad kreditje" };
        }

        instance.attendees.push(user.userName);
        instance.current++;
        user.credits--;
        saveSchedule();
        saveUsers();
        return { result : "A felhasználó sikerersen feliratkozott az órára" };
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

    function checkInUser(id, userName, tolarence) {

        var index = findInstance(id);

        if (!index) {
            return { error: "Hibás edzés azonosító" };
        }

        var instance = schedule[index];

        if (moment().isAfter(instance.date, tolarence ? tolarence : "hour")) {
            return { error: "Ez az óra már véget ért" };
        }

        var user = findUser(userName);

        if (!user) {
            return { error: "Nincs ilyen nevű felhasználó" };
        }

        if (instance.attendees.indexOf(userName) === -1) {
            return { error: "A felhasználó nem iratkozott fel erre az órára" };
        }

        if (instance.participants.indexOf(userName) > -1) {
            return { error: "A felhasználó már bejelentkezett erre az órára" };
        }

        instance.participants.push(userName);
        saveSchedule();
        return { result: "A felhasználó sikeresen bejelenkezett az órára" };
    }


    router.route("/check/in/user/:userName/session/:id")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "coach"))
                return;

            var id = req.param("id");
            var userName = req.param("userName");

            res.send(checkInUser(id, userName, "day"));

        });

    function undoCheckInUser(id, userName, tolarence) {

        var index = findInstance(id);

        if (!index) {
            return { error: "Nincs ilyen edzés azonosító" };
        }

        var instance = schedule[index];

        if (moment().isAfter(instance.date, tolarence ? tolarence : "hour")) {
            return { error: "Ez az óra már véget ért" };
        }

        var user = findUser(userName);

        if (!user) {
            return { error: "Nincs ilyen nevű felhasználó" };
        }

        if (instance.attendees.indexOf(userName) === -1) {
            return { error: "A felhasználó nem iratkozott fel erre az órára" };
        }

        var participantIndex = instance.participants.indexOf(userName);

        if (participantIndex === -1) {
            return { error: "A felhasználó nem jelentkezett be erre az órára" };
        }

        instance.participants.splice(participantIndex, 1);
        saveSchedule();
        return { result: "A felhasználó bejelenkezése sikeresen visszavonva" };
    }

    router.route("/undo/check/in/user/:userName/session/:id")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "coach"))
                return;

            var id = req.param("id");
            var userName = req.param("userName");

            res.send(undoCheckInUser(id, userName, "day"));

        });

    function removeFromTrainingSession(id, userName, daysBeforeCanLeave, tolerance) {

        var index = findInstance(id);

        if (!index) {
            return { error: "Nincs ilyen edzés azonosító" };
        }

        var instance = schedule[index];

        if (moment().isAfter(instance.date, tolerance)) {
            return { error: "Ez az óra már véget ért"};
        }

        var latestLeaveTime = moment().add({days: daysBeforeCanLeave});

        if (latestLeaveTime.isAfter(instance.date, tolerance)) {
            return { error: "Erről az óráról már túl késő leiratkozni"};
        }

        var user = findUser(userName);

        if (!user) {
            return { error: "Nincs ilyen nevű felhasználó" };
        }

        var userIndex = instance.attendees.indexOf(userName);

        if (userIndex === -1) {
            return { error: "A felhasználó nem iratkozott fel erre az órára"};
        }

        instance.attendees.splice(userIndex, 1);
        instance.current--;
        user.credits++;
        saveSchedule();
        saveUsers();

        return { message: "A felhasználó sikeresen lemondta az órát" };
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

        if (!req.authenticated) {
            res.send({ error: "Hibás felhasználónév vagy jelszó"});
            return false;
        }

        if (role && req.authenticatedAs.roles.indexOf(role) === -1) {
            res.send({ error: "Ehhez a művelethez nincs jogosultsága"});
            return false;
        }

        return true;
    }

    router.route("/my/credits")

        .get(function(req, res) {

            if (!checkAuthentication(req, res))
                return;

            var data = {};
            data.credits = req.authenticatedAs.credits;

            res.json(data);
        });

    router.route("/credits/of/user/:userName")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "coach"))
                return;

            var data = {};

            var userName = req.param("userName");

            var user = findUser(userName);

            if (!user) {
                res.send({ error: "Nincs ilyen nevű felhasználó" });
                return;
            }

            data.credits = user.credits;

            res.json(data);
        });

    function addCredits(credits, userName, coach, expiry) {

            var creditsToAdd = NaN;

            if (validator.isInt(credits)) {
                creditsToAdd = parseInt(credits);
            }

            if (isNaN(creditsToAdd) || creditsToAdd < 1) {
                return { error: "A kreditekhez csak pozitív egész szám adható"};
            }

            var user = findUser(userName);

            if(!user) {
                return { error: "Nincs ilyen nevű felhasználó"};
            }

            if(user.roles.indexOf("coach") > -1) {
                return { error: "Edzőhöz nem adható kredit"};
            }

            user.credits.free += creditsToAdd;
            user.credits.coach = coach;
            user.credits.expiry = moment().startOf("day").add(expiry);

            saveUsers();

            return { credits: user.credits, message: "Kreditek sikeresen hozáadva" };
    }    

    router.route("/credits/add/:credits/for/today/for/user/:userName")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "coach"))
                return;

            var credits = req.param("credits");
            var userName = req.param("userName");
            var coach = req.authenticatedAs.userName;
            var expiry = { day: 1 };

            res.send(addCredits(credits, userName, coach, expiry));
        });

    router.route("/credits/add/:credits/for/month/for/user/:userName")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "coach"))
                return;

            var credits = req.param("credits");
            var userName = req.param("userName");
            var coach = req.authenticatedAs.userName;
            var expiry = { month: 1 };

            res.send(addCredits(credits, userName, coach, expiry));
        });

    router.route("/credits/add/:credits/for/three/months/for/user/:userName")

        .get(function(req, res) {

            if (!checkAuthentication(req, res, "coach"))
                return;

            var credits = req.param("credits");
            var userName = req.param("userName");
            var coach = req.authenticatedAs.userName;
            var expiry = { month: 3 };

            res.send(addCredits(credits, userName, coach, expiry));
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

    https.createServer(options, app).listen(port, function(){
        console.log("Express server listening on port " + port);
    });

})();
