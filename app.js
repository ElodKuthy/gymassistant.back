'use strict';

(function () {

    var express = require('express');
    var app = express();
    var bodyParser = require('body-parser');
    var crypto = require('crypto');
    var moment = require('moment');
    var favicon = require('serve-favicon');

    var passwords = {
        'admin@gmail.com': 'e9Yx9JihUi6gXfI5/gzGNHsEtE+LiTNIM+oD/1dUlMbU727uGiJbCsWgtdSp6Q3FNkdrn94AZ3UgqTU6XsxLtA==',
        'coach@gmail.com': 'e9Yx9JihUi6gXfI5/gzGNHsEtE+LiTNIM+oD/1dUlMbU727uGiJbCsWgtdSp6Q3FNkdrn94AZ3UgqTU6XsxLtA==',
        'client@gmail.com': 'e9Yx9JihUi6gXfI5/gzGNHsEtE+LiTNIM+oD/1dUlMbU727uGiJbCsWgtdSp6Q3FNkdrn94AZ3UgqTU6XsxLtA=='
    };

    var users =  {
        'admin@gmail.com': {
            userName: 'admin',
            roles: ['admin', 'coach', 'client']
        },

        'coach@gmail.com': {
            userName: 'coach',
            roles: ['coach', 'client']
        },

        'client@gmail.com': {
            userName: 'client',
            roles: ['client']
        }
    };

    var clientNames = [
        'Sterling Archer',
        'Lana Kane',
        'Malory Archer',
        'Cyril Figgis',
        'Cheryl Tunt',
        'Pamela Poovey',
        'Ray Gillette',
        'Algernop Krieger',
        'Woodhouse',
        'Ron Cadillac',
        'Katya Kazanova',
        'Burt Reynolds'
    ];



    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.use(favicon(__dirname + '/public/favicon.ico'));

    var port = process.env.PORT || 9000;

    var router = express.Router();

    router.use(function(req, res, next) {

        console.log(req.method + ' ' + req.originalUrl);
        authenticate(req);
        console.log(req.authenticated ? ('Authenticated as ' + req.authenticatedAs) : ('Not authenticated'));

        next();
    });

    function authenticate(req) {

        req.authenticated = false;
        req.authenticatedAs = null;
        var authorizationHeader = req.headers['authorization'];

        try {

            var base64 = authorizationHeader.replace('Basic ', '');
            base64 = new Buffer(base64, 'base64');
            var userNameAndPassword = base64.toString('utf8');
            userNameAndPassword = userNameAndPassword.split(':');
            var userName = userNameAndPassword[0];
            var password = userNameAndPassword[1];
            var sha512 = crypto.createHash('sha512');
            sha512.update(password, 'utf8');
            var hash = sha512.digest(password);
            if (passwords[userName] == hash.toString('base64')) {
                req.authenticated = true;
                req.authenticatedAs = userName;
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

                result.userInfo = {
                    userName : users[req.authenticatedAs].userName,
                    roles : users[req.authenticatedAs].roles
                };

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

            if (req.authenticatedAs == 'client@gmail.com') {
                schedule.rows[2].classes[4].signedUp = true;
                schedule.rows[3].classes[1].signedUp = true;
                schedule.rows[3].classes[3].signedUp = true;
                schedule.rows[4].classes[1].signedUp = true;
                schedule.rows[4].classes[3].signedUp = true;
            }

            if (req.authenticated && users[req.authenticatedAs].roles.indexOf('coach') > -1) {
                schedule.rows.forEach(function(row){
                    row.classes.forEach(function(cell) {
                        cell.participants = clientNames.slice(0, cell.current);
                    });
                });
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
        res.json({ message: 'Canned GymAssistant REST API' });
    });

    app.use('/api', router);

    app.listen(port);
    console.log('Server running at port ' + port);

})();
