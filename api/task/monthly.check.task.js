(function () {
    'use strict';

    module.exports = MonthlyCheckTask;

    MonthlyCheckTask.$inject = ['plugins', 'users', 'trainings', 'identityService', 'mailerService'];

    function MonthlyCheckTask(plugins, users, trainings, mailerService) {
        var self = this;
        var q = plugins.q;
        var schedule = plugins.schedule;
        var moment = plugins.moment;

        self.init = function () {

            var rule = new schedule.RecurrenceRule();
            rule.date = 1;
            rule.hour = 0;
            rule.minute = 10;

            var job = schedule.scheduleJob(rule, monthlyCheck);
        }

        self.trigger = function (args) {
            return q(args).then(identityService.checkCoach).then(monthlyCheck);
        }

        function monthlyCheck(args) {

        }
    }
})();