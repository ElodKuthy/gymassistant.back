(function () {
    'use strict';

    module.exports = HourlyCheckTask;

    HourlyCheckTask.$inject = ['plugins', 'users', 'trainings', 'mailerService'];

    function HourlyCheckTask(plugins, users, trainings, mailerService) {
        var self = this;
        var schedule = plugins.schedule;
        var moment = plugins.moment;

        self.init = function () {

            var rule = new schedule.RecurrenceRule();
            rule.minute = 10;

            var job = schedule.scheduleJob(rule, hourlyCheck);
        }

        function hourlyCheck() {

        }

    }
})();