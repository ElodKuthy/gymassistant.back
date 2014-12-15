
(function () {

    'use strict';

    var express = require('express');
    var router = express.Router();

    exports.router = router;

    var container = require('./container.js')('config.json');

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
            var scheduleService = container.get('scheduleService');

            scheduleService.thisWeek(req.user).then(response.success, response.error);
        });


    router.route('/schedule/today')

        .get(function(req, res) {
            var response = new Response(res);
            var scheduleService = container.get('scheduleService');

            scheduleService.today(req.user).then(response.success, response.error);
        });

    router.route('/schedule/from/:firstDate/to/:lastDate')

        .get(function(req, res) {
            var response = new Response(res);
            var scheduleService = container.get('scheduleService');
            var firstDate = req.param('firstDate');
            var lastDate = req.param('lastDate');

            scheduleService.fetch(firstDate, lastDate, req.user).then(response.success, response.error);
        });

    router.route('/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var id = req.param('id');
                var trainingService = container.get('trainingService');
                trainingService.findById(id, req.user).then(response.success, response.error);
            }
        });

    router.route('/join/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkLoggedIn(req.user))) {
                var attendees = container.get('attendees');
                var id = req.param('id');

                attendees.joinTraining(id, req.user).then(response.success, response.error);
            }
        });

    router.route('/add/user/:userName/to/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var attendees = container.get('attendees');
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.addToTraining(id, userName, req.user).then(response.success, response.error);
            }
        });


    router.route('/leave/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkLoggedIn(req.user))) {
                var attendees = container.get('attendees');
                var id = req.param('id');

                attendees.leaveTraining(id, req.user).then(response.success, response.error);
            }
        });

    router.route('/remove/user/:userName/from/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var attendees = container.get('attendees');
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.removeFromTraining(id, userName, req.user).then(response.success, response.error);
            }
        });

    router.route('/check/in/user/:userName/to/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var attendees = container.get('attendees');
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.checkIn(id, userName, req.user).then(response.success, response.error);
            }
        });

    router.route('/undo/check/in/user/:userName/for/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var attendees = container.get('attendees');
                var userName = req.param('userName');
                var id = req.param('id');

                attendees.undoCheckIn(id, userName, req.user).then(response.success, response.error);
            }
        });

    router.route('/my/credits')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkLoggedIn(req.user))) {
                var credits = container.get('credits');

                credits.getUserCredits(req.user).then(response.success, response.error);
            }
        });

    router.route('/credits/of/user/:userName')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var credits = container.get('credits');
                var userName = req.param('userName');

                credits.getUserCreditsFromName(userName).then(response.success, response.error);
            }
        });

    router.route('/add/subscription/with/:amount/credits/to/user/:userName/for/:period')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var subscription = container.get('subscription');
                var amount = req.param('amount');
                var userName = req.param('userName');
                var period = req.param('period');
                var series = [];
                if (req.query.series) {
                    series = req.query.series.split(',');
                }

                subscription.add(amount, userName, period, series, req.user).then(response.success, response.error);
            }
        });

    router.route('/add/subscription/with/:amountPerWeek/credits/per/week/to/user/:userName/till/date/:date')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var subscription = container.get('subscription');
                var amountPerWeek = req.param('amountPerWeek');
                var userName = req.param('userName');
                var date = req.param('date');
                var series = [];
                if (req.query.series) {
                    series = req.query.series.split(',');
                }

                subscription.addTillDate(amountPerWeek, userName, date, series, req.user).then(response.success, response.error);
            }
        });

    router.route('/all/users')

        .get(function (req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var users = container.get('users');

                users.byName().then(response.success, response.error);
            }
        });

    router.route('/user/:name')

        .get(function (req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var name = req.param('name');

                identity.findByName(name).then(response.success, response.error);
            }
        });

    router.route('/add/new/user/with/name/:name/and/email/:email')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var name = req.param('name');
                var email = req.param('email');

                identity.addUser(name, email).then(response.success, response.error);
            }
        });

    router.route('/change/password')

        .post(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkLoggedIn(req.user))) {
                var password = req.body.password;
                identity.changePassword(req.user, password).then(response.success, response.error);
            }
        });

    router.route('/my/training/series')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var series = container.get('series');
                series.byCoach(req.user.name).then(response.success, response.error);
            }
        });

    router.route('/change/email/of/user/:name/to/:email')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var name = req.param('name');
                var email = req.param('email');
                identity.changeEmail(name, email).then(response.success, response.error);
            }
        });

    router.route('/cancel/training/id/:id')

        .get(function(req, res) {
            var response = new Response(res);
            var identity = container.get('identity');

            if (!response.error(identity.checkCoach(req.user))) {
                var id = req.param('id');
                var scheduleService = container.get('scheduleService');
                scheduleService.cancelTraining(id, req.user).then(response.success, response.error);
            }
        });

    router.get('/', function(req, res) {
        res.json({ message: 'GymAssistant REST API' });
    });

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

})();
