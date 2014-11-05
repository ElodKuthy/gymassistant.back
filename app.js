'use strict';

(function () {

    var express = require('express');
    var app = express();
    var bodyParser = require('body-parser');
    var crypto = require('crypto');
    var moment = require('moment');
    var favicon = require('serve-favicon');
    var jsonFile = require('jsonfile');
    var util = require('util');

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.use(favicon(__dirname + '/public/favicon.ico'));

    var port = process.env.PORT || 9000;

    var router = express.Router();

    var users = jsonFile.readFileSync(__dirname + '/data/users.json').users;
    var hashes = jsonFile.readFileSync(__dirname + '/data/hashes.json').hashes;
    var trainings = jsonFile.readFileSync(__dirname + '/data/trainings.json').trainings;

    router.use(function(req, res, next) {

        console.log(req.method + ' ' + req.originalUrl);
        authenticate(req);
        console.log(req.authenticated ? ('Authenticated as ' + req.authenticatedAs.userName) : ('Not authenticated'));

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
        var authorizationHeader = req.headers['authorization'];

        try {

            var base64 = authorizationHeader.replace('Basic ', '');
            base64 = new Buffer(base64, 'base64');
            var userNameAndPassword = base64.toString('utf8');
            console.log(userNameAndPassword);
            userNameAndPassword = userNameAndPassword.split(':');
            var userName = userNameAndPassword[0];
            var password = userNameAndPassword[1];
            var sha512 = crypto.createHash('sha512');
            sha512.update(password, 'utf8');
            var hash = sha512.digest(password);
            var hashBase64 = hash.toString('base64');

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

    router.route('/login')

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

    function fetchSchedule(firstDate, lastDate) {

        var result = {};

        result.dates = {
            "begin": firstDate,
            "end": lastDate
        };

        result.schedule = [];

        trainings.forEach(function (training){

            training.dates.forEach(function (offset){

                for (var date = firstDate.clone().day(offset.day).hour(offset.hour);
                     date.isBefore(lastDate);
                     date.add({weeks: 1})) {

                    var instance = {
                        name: training.name,
                        coach: training.coach,
                        current: training.attendees.length,
                        max: training.max,
                        date: date.clone()
                    };

                    if (isCoach) {
                        instance.attendess = training.attendees;
                    }

                    var indexToInsert = 0;

                    while (result.schedule.length > indexToInsert
                            && moment(result.schedule[indexToInsert].date).isBefore(instance.date))
                        indexToInsert++;

                    result.schedule.splice(indexToInsert, 0, instance);
                }
            });
        });

        return result;
    }

    function thisWeek() {
        var result = [];

        result.push(moment().startOf('week').add({ days: 1 }));
        result.push(moment().startOf('week').add({ days: 6 }));

        return result;
    }

    router.route('/schedule')

        .get(function(req, res) {

            res.json(fetchSchedule.apply(this, thisWeek()));
        });

    router.route('/schedule/:day')

        .get(function(req, res) {

            var firstDate = moment(req.param('day'));
            var lastDate = firstDate.clone().add({days: 1});

            res.json(fetchSchedule(firstDate, lastDate));
        });


    router.route('/schedule/:firstDate/:lastDate')

        .get(function(req, res) {

            var firstDate = moment(req.param('firstDate'));
            var lastDate = moment(req.param('lastDate'));

            res.json(fetchSchedule(firstDate, lastDate));
        });

    router.route('/credits')

        .get(function(req, res) {

            var credits = {
                free: 0,
                all: 12
            };

            res.json(credits);
        });

    router.get('/', function(req, res) {
        res.json({ message: 'GymAssistant REST API' });
    });

    app.use('/api', router);

    app.listen(port);
    console.log('Server running at port ' + port);

})();
