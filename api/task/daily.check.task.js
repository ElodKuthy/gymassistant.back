(function () {
    'use strict';

    module.exports = DailyCheckTask;

    DailyCheckTask.$inject = ['plugins', 'users', 'trainings', 'mailerService'];

    function DailyCheckTask(plugins, users, trainings, mailerService) {
        var self = this;
        var schedule = plugins.schedule;
        var moment = plugins.moment;

        self.init = function () {

            var rule = new schedule.RecurrenceRule();
            rule.hour = 0;
            rule.minute = 10;

            var job = schedule.scheduleJob(rule, dailyCheck);
        }

        function dailyCheck() {
            return users.byNameAll()
                .then(function (results) {
                    results.forEach(checkUser);
                });
        }

        function checkUser(user) {
            var now = moment();
            var emptyCredits = [];

        }

    }
})();