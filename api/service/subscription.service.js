(function () {
    'use strict';

    module.exports = SubscriptionService;

    SubscriptionService.$inject = ['plugins', 'users', 'errors', 'log', 'periods', 'identityService', 'trainings', 'attendeesService'];
    function SubscriptionService(plugins, users, errors, log, periods, identityService, trainings, attendeesService) {
        var self = this;
        var q = plugins.q;
        var moment = plugins.moment;
        var uuid = plugins.uuid;


        self.add = function(args) {

            return q(args)
                .then(checkArgs)
                .then(findUser)
                .then(addCredit)
                .then(addToTrainings);
        };

        function findUser(args) {

            return identityService.findByName(args.userName)
                .then(function (client) {
                    args.client = client;
                    return args;
                });
        }

        function checkArgs(args) {

            args.amount = parseInt(args.amount);
            args.period = periods.parse(args.period);

            if (isNaN(args.amount) || args.amount < 1) {
                throw errors.onlyPositiveIntegers();
            }

            if (!args.period) {
                throw errors.invalidPeriod();
            }

            if (!moment(args.date).isValid) {
                args.date = moment().startOf('day').unix();
            }

            if (args.coachName) {
                return q(args)
                    .then(identityService.checkAdmin)
                    .then(function () { return identityService.findByName(args.coachName) })
                    .then(function (coach) { args.coach = coach; })
                    .thenResolve(args);
            } else {
                args.coach = args.user;
                return identityService.checkCoach(args);
            }
        }

        function addCredit(args) {

            args.newCredit = {
                id: uuid.v4(),
                date: moment.unix(args.date).startOf('day').unix(),
                expiry: moment.unix(args.date).add({ days: args.period.days() }).endOf('day').unix(),
                coach: args.coach.name,
                amount: args.amount,
                free: args.amount
            };

            return users.addCredit(args.client._id, args.newCredit).thenResolve(args);
        }

        function addToTrainings(args) {

            if (!args.series || !args.series.length || args.series.length === 0) {
                return { result: 'Sikeres bérlet vásárlás (feliratkozások nélkül)'};
            }

            var promises = [];
            var offset = args.period.days();

            args.series.forEach(function (current) {
                promises.push(trainings.bySeriesTillOffset(current, args.date, offset));
            });

            var trainingsToAdd = [];

            return q.allSettled(promises)
                .then(function (results) {
                    results.forEach(function (result) {
                        if (result.state === "fulfilled") {
                            trainingsToAdd = trainingsToAdd.concat(result.value);
                        } else {
                            log.error(result.reason);
                        }
                    });

                    var errors = [];

                    function addToTraining (index) {
                        if (index === trainingsToAdd.length) {
                            return { result: 'Sikeres bérlet vásárlás', remarks: errors };
                        }

                        args.id = trainingsToAdd[index]._id;

                        return attendeesService.addToTraining(args)
                            .then(function () {
                                return addToTraining(index + 1);
                            }, function (error) {
                                errors.push(error);
                                return addToTraining(index + 1);
                            });
                    }

                    return addToTraining(0);
                });
        }
    }
})();