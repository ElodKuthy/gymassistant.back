(function () {
    'use strict';

    module.exports = SubscriptionService;

    SubscriptionService.$inject = ['plugins', 'users', 'errors', 'log', 'periods', 'identityService', 'trainings', 'attendees'];
    function SubscriptionService(plugins, users, errors, log, periods, identityService, trainings, attendees) {
        var self = this;
        var q = plugins.q;
        var moment = plugins.moment;
        var uuid = plugins.uuid;

        function addToSeries(amount, user, start, offset, series, coach, adminMode) {

            if (!series || !series.length || series.length === 0) {
                return q.when({ result: 'Sikeres bérlet vásárlás (feliratkozások nélkül)'});
            }

            var promises = [];

            series.forEach(function (current) {
                promises.push(trainings.bySeriesTillOffset(current, start, offset));
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
                            return q.when({ result: 'Sikeres bérlet vásárlás', remarks: errors });
                        }

                        return attendees.addToTraining(trainingsToAdd[index]._id, user.name, coach, adminMode)
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

        self.add = function(args) {

            if (!args.client || !args.coach) {
                throw errors.serverError();
            }

            var amount = parseInt(args.amount);
            var period = periods.parse(args.period);
            var date = parseInt(args.date);

            if (isNaN(amount) || amount < 1) {
                throw errors.onlyPositiveIntegers();
            }

            if (!period) {
                throw errors.invalidPeriod();
            }

            var begin = date ? date : moment().unix();

            var newCredit = {
                id: uuid.v4(),
                date: begin,
                expiry: moment.unix(begin).add({ days: period.days() }).endOf('day').unix(),
                coach: args.coach.name,
                amount: amount,
                free: amount
            };

            return users.addCredit(args.client._id, newCredit)
                .then(function() {
                    return addToSeries(amount, args.client, newCredit.date, period.days(), args.series, args.coach, args.admin);
                });

        };
    }
})();