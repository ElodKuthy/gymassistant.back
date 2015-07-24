(function () {
    'use strict';

    module.exports = ExpirationCheckTask;

    ExpirationCheckTask.$inject = ['plugins', 'users', 'trainings', 'mailerService'];

    function ExpirationCheckTask(plugins, users, trainings, mailerService) {
        var self = this;
        var schedule = plugins.schedule;
        var moment = plugins.moment;

        self.init = function () {

            var rule = new schedule.RecurrenceRule();
            rule.dayOfWeek = 0;
            rule.hour = 12;
            rule.minute = 0;

            var job = schedule.scheduleJob(rule, checkExpiringSubscriptions);
        }

        function checkExpiringSubscriptions() {
            return users.byNameAll()
                .then(function (results) {
                    results.forEach(checkUser);
                });
        }

        function checkUser(user) {
            var now = moment();
            var oneWeekLater = moment().add({
                days: 7
            });
            var expiringCredit = null;

            user.credits.every(function (credit) {
                var expiry = moment.unix(credit.expiry);
                if (expiry.isAfter(oneWeekLater)) {
                    expiringCredit = null;
                    return false;
                }

                if (expiry.isBetween(now, oneWeekLater) && credit.amount > 1) {
                    expiringCredit = credit;
                }

                return true;
            });

            if (expiringCredit) {
                getTrainings({
                        user: user,
                        expiringCredit: expiringCredit
                    })
                    .then(countAttendance)
                    .then(sendExpirationReminder);
            }
        }

        function getTrainings(args) {
            return trainings.byDate([moment.unix(args.expiringCredit.date), moment.unix(args.expiringCredit.expiry)]).then(function (results) {
                args.trainings = results;
                return args;
            });
        }

        function countAttendance(args) {
            args.participated = 0;
            args.missed = 0;
            args.attended = 0;
            args.trainings.forEach(function (training) {
                training.attendees.some(function (attendee) {

                    if (attendee.name === args.user.name) {
                        if (training.date > moment().unix()) {
                            args.attended++;
                        } else if (attendee.checkedIn) {
                            args.participated++;
                        } else {
                            args.missed++;
                        }

                        return true;
                    }

                    return false;
                });
            });

            return args;
        }

        function sendExpirationReminder(args) {
            if (args.user.preferences.expirationNotification) {
                return mailerService.sendExpirationReminder({
                    client: args.user,
                    credit: args.expiringCredit,
                    participated: args.participated,
                    missed: args.missed,
                    attended: args.attended
                });
            }
        }
    }

})();