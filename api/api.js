(function () {
    'use strict';
    module.exports = Api;

    Api.$inject = ['plugins', 'errors', 'log', 'identityService', 'scheduleService', 'trainingService', 'mailerService', 'attendeesService', 'creditsService', 'subscriptionService', 'users', 'series', 'seriesService', 'usersService', 'statsService', 'locationService'];

    function Api(plugins, errors, log, identityService, scheduleService, trainingService, mailerService, attendeesService, creditsService, subscriptionService, users, series, seriesService, usersService, statsService, locationService) {

        var express = require('express');
        var router = express.Router();
        var q = plugins.q;
        var moment = plugins.moment;

        router.use(function (req, res, next) {

            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

            log.info(req.method + ' ' + req.originalUrl + ' from: ' + req.connection.remoteAddress);

            identityService.authenticate(identityService.parseBasicAuthorizationHeader(req.headers.authorization))
                .then(function (result) {
                    req.user = result;
                    next();
                }, function (error) {
                    log.error(error);
                    res.json({
                        error: error.message
                    });
                });
        });

        router.get('/', function (req, res) {
            res.json({
                message: 'GymAssistant REST API'
            });
        });

        router.route('/login')

        .get(function (req, res) {

            nodeify(res, function () {

                if (!req.user)
                    throw errors.invalidUserNameOrPassword();

                return q(req.user);
            });
        });

        router.route('/schedule/this/week')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user
                }

                return scheduleService.thisWeek(args);
            });
        });

        router.route('/schedule/today')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user
                }

                return scheduleService.today(args);
            });
        });

        router.route('/schedule/from/:firstDate/to/:lastDate')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    startDate: req.param('firstDate'),
                    endDate: req.param('lastDate')
                }

                return scheduleService.fetch(args);
            });
        });

        router.route('/training/:id')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    id: req.param('id')
                }

                return trainingService.findById(args);
            });
        })

        .post(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    id: req.param('id')
                }

                addBodyToArgs(args, req.body);

                return trainingService.changeCoach(args);
            }, 'Sikeresen megváltoztattad az óratartó edzőt');
        });

        router.route('/join/training/id/:id')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    id: req.param('id')
                };

                return attendeesService.joinTraining(args);
            }, 'Sikerült feliratkoznod az órára');
        });

        router.route('/add/user/:userName/to/training/id/:id')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    userName: req.param('userName'),
                    id: req.param('id')
                };

                return attendeesService.addToTraining(args);
            }, 'A tanítványt sikeresen felirtad az órára');
        });

        router.route('/leave/training/id/:id')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    id: req.param('id')
                };

                return attendeesService.leaveTraining(args);
            }, 'Sikerült lemondanod az órát');
        });

        router.route('/remove/user/:userName/from/training/id/:id')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    userName: req.param('userName'),
                    id: req.param('id')
                };

                return attendeesService.removeFromTraining(args);
            }, 'A tanítványt sikerült eltávolítani az óráról');
        });

        router.route('/check/in/user/:userName/to/training/id/:id')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    userName: req.param('userName'),
                    id: req.param('id')
                };

                return attendeesService.checkIn(args);
            }, 'Sikeres bejelentkezés');
        });

        router.route('/undo/check/in/user/:userName/for/training/id/:id')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    userName: req.param('userName'),
                    id: req.param('id')
                };

                return attendeesService.undoCheckIn(args);
            }, 'Sikerült visszavonni a bejelentkezést');
        });

        router.route('/my/credits')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user
                };

                return creditsService.getCredits(args).then(function (args) {
                    return args.credits
                });
            });
        });

        router.route('/credits/of/user/:userName')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    userName: req.param('userName')
                };

                return creditsService.getUserCredits(args).then(function (args) {
                    return args.credits
                });
            });
        });

        router.route('/credit/details/:id')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    id: req.param('id'),
                    details: 'full'
                };

                return creditsService.getCredit(args);
            });
        });

        router.route('/credit/details/:id/of/:name')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    id: req.param('id'),
                    userName: req.param('name'),
                    details: 'full'
                };

                return creditsService.getCredit(args);
            });
        })

        .post(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    id: req.param('id'),
                    userName: req.param('name')
                };

                addBodyToArgs(args, req.body);

                return creditsService.updateCredit(args);
            }, 'Sikeresen módosítottad a bérletet');
        });

        router.route('/add/first/time')

        .post(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    firstTime: true
                }

                addBodyToArgs(args, req.body);

                return subscriptionService.add(args);
            });
        })

        router.route('/add/subscription/with/:amount/credits/to/user/:userName/for/:period')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    userName: req.param('userName'),
                    amount: req.param('amount'),
                    period: req.param('period'),
                    date: moment().startOf('day').unix(),
                    series: req.query.series ? req.query.series.split(',') : []
                }

                return subscriptionService.add(args);
            });
        });

        router.route('/add/subscription/with/:amount/credits/to/user/:userName/from/date/:date/for/:period/by/:coachName')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    coachName: req.param('coachName'),
                    userName: req.param('userName'),
                    date: req.param('date'),
                    amount: req.param('amount'),
                    period: req.param('period'),
                    series: req.query.series ? req.query.series.split(',') : []
                }

                return subscriptionService.add(args);
            });
        });

        router.route('/all/users')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user
                };

                return usersService.getAllUsers(args);
            });
        });

        router.route('/all/coaches')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user
                };

                return usersService.getAllCoaches(args);
            });
        });

        router.route('/user/:name')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    name: req.param('name')
                };

                return usersService.getUserByName(args);
            });
        });

        router.route('/add/new/user/with/name/:name/and/email/:email')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    userName: req.param('name'),
                    email: req.param('email')
                };

                return identityService.addClient(args);
            }, 'Sikeresült létrehozni az új felhasználót');
        });

        router.route('/add/new/coach/with/name/:name/and/email/:email')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    userName: req.param('name'),
                    email: req.param('email')
                };

                return identityService.addCoach(args);
            }, 'Sikeresült létrehozni az új felhasználót');
        });

        router.route('/send/registration/email/to/user/:name')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    name: req.param('name')
                };

                return identityService.resendRegistrationEmail(args);
            }, 'A regisztrációs emailt sikeresen elküldtük újra');
        });

        router.route('/change/name')

        .post(function (req, res) {

            nodeify(res, function () {
                var args = {
                    user: req.user
                };

                addBodyToArgs(args, req.body);

                return identityService.changeName(args);
            }, 'Sikeres névváltoztatás');
        });

        router.route('/change/password')

        .post(function (req, res) {

            nodeify(res, function () {
                var args = {
                    user: req.user
                };

                addBodyToArgs(args, req.body);

                return identityService.changePassword(args);
            }, 'Sikeres jelszóváltoztatás');
        });

        router.route('/change/email/of/user/:name/to/:email')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    name: req.param('name'),
                    email: req.param('email')
                };

                return identityService.changeEmail(args);

            }, 'Az email címet sikeresen megváltoztattuk');
        });

        router.route('/cancel/training/id/:id')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    id: req.param('id')
                };

                return scheduleService.cancelTraining(args);
            }, 'Az órát sikeresen lemondásra került');
        });

        router.route('/reset/password/user/:name/email/:email')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    name: req.param('name'),
                    email: req.param('email')
                };

                return identityService.resetPassword(args);
            });
        });

        router.route('/all/series')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user
                };

                return seriesService.getAll(args);
            });
        });

        router.route('/series/:id')

        .get(function (req, res) {

            nodeify(res, function () {
                var args = {
                    user: req.user,
                    id: req.param('id')
                };

                return seriesService.get(args);
            });
        })

        .post(function (req, res) {

            nodeify(res, function () {
                var args = {
                    user: req.user,
                    id: req.param('id')
                };

                addBodyToArgs(args, req.body);

                return seriesService.set(args);
            });
        })

        .delete(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    id: req.param('id'),
                };

                return seriesService.deleteSeries(args);
            });
        });

        router.route('/add/new/series')

        .post(function (req, res) {

            nodeify(res, function () {
                var args = {
                    user: req.user,
                };

                addBodyToArgs(args, req.body);

                return seriesService.add(args);
            });
        });

        router.route('/update/trainings/from/:from/to/:to')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    from: moment(req.param('from'), 'YYYY-MM-DD'),
                    to: moment(req.param('to'), 'YYYY-MM-DD'),
                    ids: req.query.series ? req.query.series.split(',') : []
                };

                return seriesService.updateTrainings(args);
            });
        });

        router.route('/active/subscriptions/from/:from/to/:to')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    from: moment(req.param('from'), 'YYYY-MM-DD'),
                    to: moment(req.param('to'), 'YYYY-MM-DD')
                };

                return subscriptionService.getActiveSubscriptions(args);
            });
        });

        router.route('/my/preferences')

        .post(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user
                };

                addBodyToArgs(args, req.body);

                return identityService.updatePreferences(args);
            });
        });

        router.route('/get/overview/:from/:to')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    from: moment(req.param('from'), 'YYYY-MM-DD'),
                    to: moment(req.param('to'), 'YYYY-MM-DD')
                };

                return statsService.getOverview(args);
            });
        });

        router.route('/get/overview/:coach/:from/:to')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    coach: req.param('coach'),
                    from: moment(req.param('from'), 'YYYY-MM-DD'),
                    to: moment(req.param('to'), 'YYYY-MM-DD')
                };

                return statsService.getOverview(args);
            });
        });

        router.route('/unsubscribe/:id')

        .post(function (req, res) {

            nodeify(res, function () {

                var args = {
                    id: req.param('id')
                };

                addBodyToArgs(args, req.body);

                return identityService.unsubscribe(args);
            }, 'Sikeres leiratkozás');
        });

        router.route('/location')

        .get(function (req, res) {
            nodeify(res, function () {

                return locationService.all();
            });
        });

        function addBodyToArgs(args, body) {
            for (var key in body) {
                if (body.hasOwnProperty(key)) {
                    args[key] = body[key];
                }
            }
        }

        function nodeify(res, action, resultOverride) {

            q.try(action).done(function (result) {
                res.json(resultOverride ? resultOverride : result);
            }, function (err) {
                res.json({
                    error: err.message
                });
            });
        }

        this.router = router;
    }
})();