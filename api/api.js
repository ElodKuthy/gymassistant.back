
(function () {

    'use strict';

    var express = require('express');
    var router = express.Router();

    exports.router = router;

    var container = require('./container.js');

    var log = container.get('log');
    var errors = container.get('errors');

    router.use(function(req, res, next) {

        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

        var identity = container.get('identity');

        log.info(req.method + ' ' + req.originalUrl + ' from: ' + req.connection.remoteAddress);
        identity.authenticate(req.headers.authorization)
            .then(function (result) {
                req.user = result;
                next();
            }, function (error) {
                log.error(error);
                next();
            });

    });

    router.route('/login')

        .get(function(req, res) {

            if (req.user) {
                res.json(req.user);
            } else {
                res.json(errors.invalidUserNameOrPassword());
            }
        });

    router.route('/schedule/this/week')

        .get(function(req, res) {

            var schedule = container.get('schedule');

            schedule.thisWeek(req.user)
                .then(function (result) {
                    res.json(result);
                }, function (error) {
                   res.json(errors.serverError());

                });
        });


    router.route('/schedule/today')

        .get(function(req, res) {

            var schedule = container.get('schedule');

            schedule.today(req.user)
                .then(function (result) {
                    res.json(result);
                }, function (error) {
                   res.json(errors.serverError());
                });
        });

    router.route('/schedule/from/:firstDate/to/:lastDate')

        .get(function(req, res) {

            var schedule = container.get('schedule');
            var firstDate = req.param('firstDate');
            var lastDate = req.param('lastDate');

            schedule.fetch(firstDate, lastDate, req.user)
                .then(function (result) {
                    res.json(result);
                }, function (error) {
                   res.json(errors.serverError());
                });
        });

    router.route('/training/id/:id')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var id = req.param('id');
                var schedule = container.get('schedule');
                schedule.findById(id, req.user)
                    .then(function (result) {
                        res.json(result);
                    }, function (error) {
                        res.json(error);
                    });
            }
        });

    router.route('/join/training/id/:id')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkLoggedIn(req.user);

            if (error) {
                res.json(error);
            } else {
                var attendees = container.get('attendees');
                var id = req.param('id');

                attendees.joinTraining(id, req.user)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.route('/add/user/:userName/to/training/id/:id')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var attendees = container.get('attendees');
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.addToTraining(id, userName, req.user)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });


    router.route('/leave/training/id/:id')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkLoggedIn(req.user);

            if (error) {
                res.json(error);
            } else {
                var attendees = container.get('attendees');
                var id = req.param('id');

                attendees.leaveTraining(id, req.user)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.route('/remove/user/:userName/from/training/id/:id')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var attendees = container.get('attendees');
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.removeFromTraining(id, userName, req.user)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.route('/check/in/user/:userName/to/training/id/:id')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var attendees = container.get('attendees');
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.checkIn(id, userName, req.user)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.route('/undo/check/in/user/:userName/for/training/id/:id')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var attendees = container.get('attendees');
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.undoCheckIn(id, userName, req.user)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.route('/my/credits')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkLoggedIn(req.user);

            if (error) {
                res.json(error);
            } else {
                var credits = container.get('credits');

                credits.getUserCredits(req.user)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.route('/credits/of/user/:userName')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var credits = container.get('credits');
                var userName = req.param('userName');

                credits.getUserCreditsFromName(userName)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });


    router.route('/add/subscription/with/:amount/credits/to/user/:userName/for/:period')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var subscription = container.get('subscription');
                var amount = req.param('amount');
                var userName = req.param('userName');
                var period = req.param('period');
                var series = [];
                if (req.query.series) {
                    series = req.query.series.split(',');
                }

                subscription.add(amount, userName, period, series, req.user)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });


    router.route('/all/users')

        .get(function (req, res) {

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var users = container.get('users');

                users.byName()
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.route('/user/:name')

        .get(function (req, res) {

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var name = req.param('name');

                identity.findByName(name)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.route('/add/new/user/with/name/:name/and/email/:email')

        .get(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var name = req.param('name');
                var email = req.param('email');

                identity.addUser(name, email)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.route('/change/password')

        .post(function(req, res) {

            var identity = container.get('identity');

            var error = identity.checkLoggedIn(req.user);

            if (error) {
                res.json(error);
            } else {
                var password = req.body.password;

                identity.changePassword(req.user, password)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.route('/my/training/series')

        .get(function(req, res) {

            log.debug('my/training/series');

            var identity = container.get('identity');

            var error = identity.checkCoach(req.user);

            if (error) {
                res.json(error);
            } else {
                var series = container.get('series');

                series.byCoach(req.user.name)
                    .then(function(result) {
                        res.json(result);
                    }, function(error) {
                        res.json(error);
                    });
            }
        });

    router.get('/', function(req, res) {
        res.json({ message: 'GymAssistant REST API' });
    });

})();
