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

    router.use(function(req, res, next) {

        console.log(req.method + ' ' + req.originalUrl);
        authenticate(req);
        console.log(req.authenticated ? ('Authenticated as ' + req.authenticatedAs.userName) : ('Not authenticated'));

        next();
    });

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

    router.route('/schedule')

        .get(function(req, res) {

            var schedule = {
                "dates": {
                    "begin": moment().day() == 0 ? moment().day(1) : moment().day(1 - moment().day()),
                    "end": moment().day() == 0 ? moment().day(6) : moment().day(6 - moment().day())
                },
                "rows" : [
                    { "time" : "7:00",
                        "classes" : [
                            { "name": "Dinamikus Jóga", "trainer": "Krisztina", "max": 12, "current": 6 },
                            { "name": "Bajnokok Reggelije", "trainer": "Dávid", "max": 12, "current": 10 },
                            { "name": "Bajnokok Reggelije", "trainer": "Dávid", "max": 12, "current": 9 },
                            { "name": "Dinamikus Jóga", "trainer": "Krisztina", "max": 12, "current": 8 },
                            { "name": "Bajnokok Reggelije", "trainer": "Dávid", "max": 12, "current": 5 },
                            { "name": "Kettlebell+", "trainer": "Arnold", "max": 12, "current": 4 }
                        ]},
                    {
                        "time" : "17:00",
                        "classes" : [
                            { "name": "Haladó Kettlebell", "trainer": "Arnold", "max": 12, "current": 9 },
                            { "name": "Haladó Kettlebell", "trainer": "Albert", "max": 12, "current": 11 },
                            { "name": "Haladó Kettlebell", "trainer": "Arnold", "max": 12, "current": 12 },
                            { "name": "Haladó Kettlebell", "trainer": "Albert", "max": 12, "current": 11 },
                            { },
                            { }
                        ]},
                    { "time" : "18:00",
                        "classes" : [
                            { "name": "Kezdő Kettlebell", "trainer": "Arnold", "max": 12, "current": 9 },
                            { "name": "Haladó Kettlebell", "trainer": "Albert", "max": 12, "current": 11 },
                            { "name": "kezdő Kettlebell", "trainer": "Arnold", "max": 12, "current": 12 },
                            { "name": "Haladó Kettlebell", "trainer": "Albert", "max": 12, "current": 11 },
                            { "name": "Clubbell", "trainer": "Albert", "max": 8, "current": 4},
                            { }
                        ]},
                    { "time" : "19:00",
                        "classes" : [
                            { "name": "OldSchool Training", "trainer": "Zsolt", "max": 12, "current": 6 },
                            { "name": "Primal Move", "trainer": "Albert", "max": 8, "current": 4 },
                            { "name": "OldSchool Training", "trainer": "Zsolt", "max": 12, "current": 8 },
                            { "name": "Primal Move", "trainer": "Albert", "max": 8, "current": 4 },
                            { "name": "Bajnokok Vacsorája", "trainer": "David", "max": 12, "current": 8 },
                            { }
                        ]},
                    { "time" : "20:00",
                        "classes" : [
                            { "name": "OldSchool Training", "trainer": "Zsolt", "max": 12, "current": 7 },
                            { "name": "Haladó Kettlebell", "trainer": "Albert", "max": 12, "current": 11 },
                            { "name": "OldSchool Training", "trainer": "Zsolt", "max": 12, "current": 7 },
                            { "name": "Haladó Kettlebell", "trainer": "Albert", "max": 12, "current": 12 },
                            { "name": "Bajnokok Vacsorája", "trainer": "David", "max": 12, "current": 7 },
                            { }
                        ]}
                ]

            };

            if (req.authenticated && req.authenticatedAs.roles.indexOf('coach') > -1) {


            }

            res.json(schedule);
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
