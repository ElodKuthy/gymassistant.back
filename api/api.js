(function () {
    'use strict';
    module.exports = Api;

    Api.$inject = ['plugins', 'errors', 'log', 'identityService', 'scheduleService', 'trainingService', 'mailerService', 'attendees', 'creditsService', 'subscriptionService', 'users', 'series', 'seriesService', 'usersServiceFactory'];
    function Api(plugins, errors, log, identityService, scheduleService, trainingService, mailerService, attendees, creditsService, subscriptionService, users, series, seriesService, usersServiceFactory) {

    var express = require('express');
    var router = express.Router();
    var q = plugins.q;
    var moment = plugins.moment;

    router.use(function(req, res, next) {

        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

        res.done = function (err, result) {
            if (err) {
                res.send({ error: err.message });
            } else {
                res.send(result);
            }
        };

        log.info(req.method + ' ' + req.originalUrl + ' from: ' + req.connection.remoteAddress);

        identityService.authenticate(identityService.parseBasicAuthorizationHeader(req.headers.authorization))
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
            var response = new Response(res);
            if (req.user) {
                response.success(req.user);
            } else {
                response.error(errors.invalidUserNameOrPassword());
            }
        });

    router.route('/schedule/this/week')


        .get(function(req, res) {
            var response = new Response(res);
            scheduleService.thisWeek(req.user).then(response.success, response.error);
        });


    router.route('/schedule/today')

        .get(function(req, res) {
            var response = new Response(res);

            scheduleService.today(req.user).then(response.success, response.error);
        });

    router.route('/schedule/from/:firstDate/to/:lastDate')

        .get(function(req, res) {
            var response = new Response(res);
            var firstDate = req.param('firstDate');
            var lastDate = req.param('lastDate');

            scheduleService.fetch(firstDate, lastDate, req.user).then(response.success, response.error);
        });

    router.route('/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkCoach(req.user))) {
                var id = req.param('id');
                trainingService.findById(id, req.user).then(response.success, response.error);
            }
        });

    router.route('/join/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkLoggedIn(req.user))) {
                var id = req.param('id');

                attendees.joinTraining(id, req.user).then(response.success, response.error);
            }
        });

    router.route('/add/user/:userName/to/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkCoach(req.user))) {
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.addToTraining(id, userName, req.user).then(response.success, response.error);
            }
        });


    router.route('/leave/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkLoggedIn(req.user))) {
                var id = req.param('id');

                attendees.leaveTraining(id, req.user).then(response.success, response.error);
            }
        });

    router.route('/remove/user/:userName/from/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkCoach(req.user))) {
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.removeFromTraining(id, userName, req.user).then(response.success, response.error);
            }
        });

    router.route('/check/in/user/:userName/to/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkCoach(req.user))) {
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.checkIn(id, userName, req.user).then(response.success, response.error);
            }
        });

    router.route('/undo/check/in/user/:userName/for/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkCoach(req.user))) {
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.undoCheckIn(id, userName, req.user).then(response.success, response.error);
            }
        });

    router.route('/my/credits')

        .get(function(req, res) {

             return identityService.checkLoggedIn2(req.user)
                .then(creditsService.getUserCredits)
                .nodeify(res.done);
        });

    router.route('/credits/of/user/:userName')

        .get(function(req, res) {

            return identityService.checkCoach2(req.user)
                .then (function () { return creditsService.getUserCreditsFromName(req.param('userName')); })
                .nodeify(res.done);
        });

    router.route('/add/subscription/with/:amount/credits/to/user/:userName/for/:period')

        .get(function(req, res) {

            q.all([
                identityService.checkCoach2(req.user),
                identityService.findByName(req.param('userName'))
                ]).spread(function (coach, client) {
                    return subscriptionService.add({
                        client: client,
                        coach: coach,
                        amount: req.param('amount'),
                        period: req.param('period'),
                        series: req.query.series ? req.query.series.split(',') : []
                    });
                })
                .nodeify(res.done);
        });

    router.route('/add/subscription/with/:amount/credits/to/user/:userName/from/date/:date/for/:period/by/:coachName')

        .get(function(req, res) {

            q.all([
                identityService.checkAdmin(req.user),
                identityService.findByName(req.param('coachName')),
                identityService.findByName(req.param('userName'))
                ]).spread(function (admin, coach, client) {
                    return subscriptionService.add({
                        client: client,
                        coach: coach,
                        admin: admin,
                        date: req.param('date'),
                        amount: req.param('amount'),
                        period: req.param('period'),
                        series: req.query.series ? req.query.series.split(',') : []
                    });
                })
                .nodeify(res.done);
        });

    router.route('/all/users')

        .get(function (req, res) {

            nodeify(res, function () {
                var usersService = usersServiceFactory.use('init', { user: req.user }).get();
                var promise = usersService.getAllUsers();

                return promise;
            });
        });

    router.route('/all/coaches')

        .get(function (req, res) {

            nodeify(res, function () {
                var usersService = usersServiceFactory.use('init', { user: req.user }).get();
                var promise = usersService.getAllCoaches();

                return promise;
            });
        });

    router.route('/user/:name')

        .get(function (req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkCoach(req.user))) {
                var name = req.param('name');

                identityService.findByName(name).then(response.success, response.error);
            }
        });

    router.route('/add/new/user/with/name/:name/and/email/:email')

        .get(function(req, res) {

            return identityService.checkCoach2(req.user)
                .then(function () {
                    return identityService.addClient(req.param('name'), req.param('email'));
                })
                .then(mailerService.sendRegistrationMail)
                .nodeify(res.done);
        });

    router.route('/add/new/coach/with/name/:name/and/email/:email')

        .get(function(req, res) {

            return identityService.checkAdmin(req.user)
                .then(function () {
                    return identityService.addCoach(req.param('name'), req.param('email'));
                })
                .then(mailerService.sendCoachRegistrationMail)
                .nodeify(res.done);
        });

    router.route('/send/registration/email/to/user/:name')

        .get(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkCoach(req.user))) {
                var name = req.param('name');

            identityService.findByName(name)
                .then(identityService.resetPassword)
                .then(mailerService.sendRegistrationMail)
                .nodeify(res.done);
            }
        });

    router.route('/change/password')

        .post(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkLoggedIn(req.user))) {
                var password = req.body.password;
                identityService.changePassword(req.user, password).then(response.success, response.error);
            }
        });

    router.route('/change/email/of/user/:name/to/:email')

        .get(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkCoach(req.user))) {
                var name = req.param('name');
                var email = req.param('email');
                identityService.changeEmail(name, email).then(response.success, response.error);
            }
        });

    router.route('/cancel/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);

            if (!response.error(identityService.checkCoach(req.user))) {
                var id = req.param('id');
                scheduleService.cancelTraining(id, req.user).then(response.success, response.error);
            }
        });

    router.route('/reset/password/user/email/:email')

        .get(function(req, res) {
            var email = req.param('email');

            identityService.findByEmail(email)
                .then(identityService.resetPassword)
                .then(mailerService.sendResetPasswordMail)
                .nodeify(res.done);
        });

    router.route('/all/series')

        .get(function(req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user
                };

                return seriesService.getAll(args);
            });
        });

    router.route('/series/:id')

        .get(function(req, res) {

            nodeify(res, function () {
                var args = {
                    user: req.user,
                    id: req.param('id')
                };

                return seriesService.get(args);
            });
        })

        .post(function(req, res) {

            nodeify(res, function () {
                var args = {
                    user: req.user,
                    id: req.param('id')
                };

                addBodyToArgs(args, req.body);

                return seriesService.set(args);
            });
        });

    router.route('/add/new/series')

        .post(function(req, res) {

            nodeify(res, function () {
                var args = {
                    user: req.user,
                };

                addBodyToArgs(args, req.body);

                return seriesService.add(args);
            });
        });

    router.get('/', function(req, res) {
        res.json({ message: 'GymAssistant REST API' });
    });

    router.route('/update/trainings/from/:from/to/:to')

        .get(function (req, res) {

            nodeify(res, function () {

                var args = {
                    user: req.user,
                    from: moment(req.param('from'), 'YYYY-MM-DD'),
                    to: moment(req.param('to'), 'YYYY-MM-DD'),
                    ids: req.query.series ? req.query.series.split(',') : []
                }

                return seriesService.updateTrainings(args);
            });
        });

    function addBodyToArgs(args, body) {
        for (var key in body) {
            if (body.hasOwnProperty(key)) {
                args[key] = body[key];
            }
        }
    }

    function nodeify (res, action) {

        q.try(action).done(function (result) { res.json(result); }, function (err) { res.json({ error : err.message }); });
    }

    function Response (res) {
        var self = this;

        self.success = function (result) {
            res.json(result);
        };

        self.error = function (err) {
            if (err) {
                res.send({ error : err.message });
            }
            return err;
        };
    }

    this.router = router;
}
})();